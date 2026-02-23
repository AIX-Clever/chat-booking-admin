#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AdminStack } from '../lib/admin-stack';

const app = new cdk.App();

const envName = process.env.ENV || 'dev';
const stackName = envName === 'prod' ? 'ChatBooking-Admin' : `ChatBooking-Admin-${envName}`;

new AdminStack(app, stackName, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
  domainName: process.env.DOMAIN_NAME,
  certificateArn: process.env.CERTIFICATE_ARN
});
