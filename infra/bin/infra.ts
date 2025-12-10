#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AdminStack } from '../lib/admin-stack';

const app = new cdk.App();
new AdminStack(app, 'ChatBooking-Admin', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});
