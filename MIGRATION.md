# Migration Guide: v1.x to v2.0.0

This guide will help you migrate from acady-connector-dynamodb v1.x to v2.0.0.

## Breaking Changes

### AWS SDK v3 Migration

Version 2.0.0 upgrades from AWS SDK v2 to AWS SDK v3. This brings several important changes:

1. **Peer Dependencies**
   - Remove `aws-sdk` dependency
   - Add new peer dependencies:
     ```bash
     npm install @aws-sdk/client-dynamodb@^3.734.0 @aws-sdk/lib-dynamodb@^3.734.0
     ```

2. **Configuration Changes**
   - The configuration object structure remains the same
   - AWS credentials and region configuration behavior is unchanged
   - DynamoDB Local configuration remains compatible

### Code Changes Required

No changes to your code should be necessary if you're using the public API. All changes are internal to the library:

- All DynamoDB operations now use the AWS SDK v3 command pattern internally
- Error handling has been updated to use AWS SDK v3's error structure
- The DocumentClient has been replaced with DynamoDBDocumentClient

### Example Migration

#### Before (v1.x)
```json
{
  "dependencies": {
    "acady-connector-dynamodb": "^1.7.1"
  },
  "peerDependencies": {
    "aws-sdk": "^2.821.0"
  }
}
```

#### After (v2.0.0)
```json
{
  "dependencies": {
    "acady-connector-dynamodb": "^2.0.0"
  },
  "peerDependencies": {
    "@aws-sdk/client-dynamodb": "^3.734.0",
    "@aws-sdk/lib-dynamodb": "^3.734.0"
  }
}
```

## Benefits of Upgrading

1. **Future-Proof**: AWS SDK v2 enters maintenance mode on September 8, 2024
2. **Performance**: AWS SDK v3 offers improved performance through modular architecture
3. **Better Types**: Enhanced TypeScript support with AWS SDK v3
4. **Modern Features**: Access to latest AWS features and improvements

## Troubleshooting

If you encounter any issues during migration:

1. Ensure all peer dependencies are installed correctly
2. Verify AWS credentials are properly configured
3. Check for any custom configuration that might need updating

## Need Help?

If you encounter any issues during migration, please [open an issue](https://github.com/acady-io/acady-connector-dynamodb/issues) on our GitHub repository.
