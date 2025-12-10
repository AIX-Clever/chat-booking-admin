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

        // 2. CloudFront Distribution
        const distribution = new cloudfront.Distribution(this, 'AdminPanelDist', {
            defaultBehavior: {
                origin: new origins.S3Origin(siteBucket),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                functionAssociations: [], // Could add internal router if needed for SPA
            },
            errorResponses: [
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html', // SPA fallback
                },
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html', // SPA fallback
                },
            ],
        });

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
