import { DynamodbEntityConnector } from "../src";

let connector: DynamodbEntityConnector;

beforeAll(async () => {
    // Set up AWS config for testing
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test';
    process.env.AWS_SECRET_ACCESS_KEY = 'test';
    
    const tableName = 'test-' + Date.now();
    connector = new DynamodbEntityConnector(tableName, 'id', undefined, {
        endpoint: 'http://localhost:8000', // DynamoDB Local endpoint
        region: 'us-east-1',
        credentials: {
            accessKeyId: 'test',
            secretAccessKey: 'test'
        }
    });
});

test('DynamodbEntityConnector: Read and Write', async () => {
    const id = 'test-entity-' + Date.now();
    const writeEntity = {
        id,
        foo: 'bar',
        bar: {
            foo: true
        }
    };

    await connector.storeItem(writeEntity);
    const readEntity = await connector.getItem({id});

    expect(readEntity).toEqual(writeEntity);
}, 30000);  // Increased timeout for table creation

afterAll(async () => {
    await connector.deleteTable();
});

