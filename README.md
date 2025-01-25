# Acady Connector DynamoDB

A TypeScript library for simplified DynamoDB operations with support for batch operations, table management, and flexible querying.

## Installation

```bash
npm install acady-connector-dynamodb
```

### Peer Dependencies
This package requires the following peer dependencies:
```bash
npm install @aws-sdk/client-dynamodb@^3.734.0 @aws-sdk/lib-dynamodb@^3.734.0
```

## Usage

```typescript
import { DynamodbEntityConnector } from 'acady-connector-dynamodb';

// Initialize the connector
const connector = new DynamodbEntityConnector('table-name', 'id');

// Store an item
await connector.storeItem({
    id: 'item-1',
    data: 'example'
});

// Retrieve an item
const item = await connector.getItem({ id: 'item-1' });

// Query items
const items = await connector.query({
    id: 'item-1'
}, 'index-name');

// Batch operations
await connector.batchGet([
    { id: 'item-1' },
    { id: 'item-2' }
]);

// Table management
await connector.createTable();
await connector.deleteTable();
```

## Features

- Full AWS SDK v3 support
- Automatic table creation
- Batch operations with configurable batch size
- Support for DynamoDB Local for testing
- Comprehensive error handling
- TypeScript type definitions
- Table prefix support via `DDB_PREFIX` environment variable

## Configuration

The connector accepts the following configuration options:

```typescript
const connector = new DynamodbEntityConnector(
    tableName,    // DynamoDB table name
    partitionKey, // Partition key name
    sortKey?,     // Optional sort key name
    config?       // Optional AWS SDK configuration
);
```

### AWS Configuration

The connector will automatically use AWS credentials from environment variables:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_SESSION_TOKEN` (optional)

For local development, you can use DynamoDB Local by providing the endpoint in the config:

```typescript
const connector = new DynamodbEntityConnector('table-name', 'id', undefined, {
    endpoint: 'http://localhost:8000',
    region: 'local',
    credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test'
    }
});
```

## Migration

If you're upgrading from v1.x to v2.x, please see the [Migration Guide](./MIGRATION.md) for detailed instructions.

## License

MIT
