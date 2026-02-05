import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';
import * as path from 'path';

export class AdminStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // 1. S3 Bucket for hosting
        const siteBucket = new s3.Bucket(this, 'AdminPanelBucket', {
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: '404.html', // Next.js export usually has this
            publicReadAccess: false,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });

        // 2. CloudFront Origin Access Control (OAC)
        const oac = new cloudfront.CfnOriginAccessControl(this, 'AdminOAC', {
            originAccessControlConfig: {
                name: `AdminOAC-${this.node.addr}`,
                originAccessControlOriginType: 's3',
                signingBehavior: 'always',
                signingProtocol: 'sigv4',
            },
        });

        // ==================================================================================
        // CloudFront Function for URL Rewriting (Static Export Routing)
        // ==================================================================================
        // 
        // CONTEXT:
        // This Next.js app uses `output: 'export'` which generates static HTML files
        // (e.g., bookings.html, availability.html) stored in S3.
        //
        // PROBLEM:
        // When users navigate to /bookings or refresh the page (F5), CloudFront/S3
        // looks for a file literally named "bookings" (without .html extension).
        // S3 returns 403/404 because the actual file is "bookings.html".
        //
        // SOLUTION:
        // This CloudFront Function intercepts ALL viewer requests and rewrites URLs:
        // - /bookings → /bookings.html
        // - /availability → /availability.html
        // - / → /index.html
        //
        // SECURITY CONSIDERATIONS:
        // ✅ This function is INTENTIONALLY simple to minimize attack surface
        // ✅ Does NOT access network, AWS services, or user data
        // ✅ Maximum execution time: 1ms (enforced by CloudFront)
        // ✅ No logging of sensitive data
        // ⚠️  Executes on EVERY request - any bug affects 100% of traffic
        //
        // ALTERNATIVES CONSIDERED:
        // 1. AWS Amplify Hosting: Would eliminate this function but:
        //    - Breaks multi-stack CDK architecture cohesion
        //    - More expensive for high traffic (76% higher data transfer cost)
        //    - Vendor lock-in
        // 2. trailingSlash: true in next.config.js: Would change all URLs to /bookings/
        //    - Still requires similar rewriting logic for index.html resolution
        //    - Changes user-facing URLs
        // 3. S3 Static Website Hosting: Requires making bucket public (security risk)
        //
        // MAINTENANCE:
        // - DO NOT add complex logic here (no regex, no conditionals beyond file extension check)
        // - Test thoroughly if modifying - affects all routes
        // - Consider adding CloudWatch Logs if debugging is needed
        //
        // ==================================================================================
        const rewriteFunction = new cloudfront.Function(this, 'RewriteFunction', {
            code: cloudfront.FunctionCode.fromInline(`
                function handler(event) {
                    var request = event.request;
                    var uri = request.uri;
                    if (uri.endsWith('/')) {
                        request.uri += 'index.html';
                    } else if (!uri.includes('.')) {
                        request.uri += '.html';
                    }
                    return request;
                }
            `),
            comment: 'Rewrites URLs for Next.js static export (e.g., /bookings → /bookings.html)',
        });

        // 3. CloudFront Distribution using OAC
        const distribution = new cloudfront.Distribution(this, 'AdminPanelDist', {
            defaultBehavior: {
                origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket, {
                    originAccessControlId: oac.attrId,
                }),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                functionAssociations: [
                    {
                        function: rewriteFunction,
                        eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
                    }
                ],
            },
            errorResponses: [
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                },
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                },
            ],
        });

        // 4. Add Bucket Policy for OAC
        siteBucket.addToResourcePolicy(new cdk.aws_iam.PolicyStatement({
            actions: ['s3:GetObject'],
            resources: [siteBucket.arnForObjects('*')],
            principals: [new cdk.aws_iam.ServicePrincipal('cloudfront.amazonaws.com')],
            conditions: {
                StringEquals: {
                    'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`
                }
            }
        }));

        // 3. Deploy site contents
        new s3deploy.BucketDeployment(this, 'DeployAdminPanel', {
            sources: [s3deploy.Source.asset(path.join(__dirname, '../../out'))], // Assumes 'out' for Next.js export
            destinationBucket: siteBucket,
            distribution: distribution,
            distributionPaths: ['/*'],
        });

        // Outputs
        new cdk.CfnOutput(this, 'AdminUrl', {
            value: distribution.distributionDomainName,
        });
    }
}
