import * as AWS from "aws-sdk";
import {DocumentClient} from "aws-sdk/lib/dynamodb/document_client";
import AttributeMap = DocumentClient.AttributeMap;
import BatchGetResponseMap = DocumentClient.BatchGetResponseMap;
import {ArrayHelper, WaitHelper} from "@web-academy/core-lib";
import {AWSError, DynamoDB} from "aws-sdk";

export class DynamodbEntityConnector {
    private static BATCH_SIZE = 25;
    private client: DocumentClient;

    private readonly tableName: string;
    private readonly partitionKey: string;
    private readonly sortKey?: string;

    constructor(tableName: string, partitionKey: string, sortKey?: string) {
        this.tableName = tableName;
        this.partitionKey = partitionKey;
        this.sortKey = sortKey;
        this.client = new AWS.DynamoDB.DocumentClient();
    }

    async batchGet(keys: any[]): Promise<AttributeMap[] | undefined> {
        const requestedItems = {};
        requestedItems[this.tableName] = {
            Keys: keys
        };

        const params = {
            RequestItems: requestedItems
        };
        const response = await this._batchGet(params);

        if (response)
            return response[this.tableName];
        else
            return;
    }

    private async _batchGet(params: any, retry?: boolean): Promise<BatchGetResponseMap | undefined> {
        const self = this;
        return new Promise((resolve, reject) => {
            self.client.batchGet(params, function (err, data) {
                if (err) {
                    if (retry)
                        reject(err);
                    else
                        self._solveError(err, params, '_batchGet', resolve, reject);
                } else resolve(data.Responses);
            });
        });
    }

    async getItem(key: any): Promise<AttributeMap | undefined> {
        return this._getItem({
            TableName: this.tableName,
            Key: key
        });
    };

    private async _getItem(params: any, retry?: boolean): Promise<AttributeMap | undefined> {
        const self = this;
        return new Promise((resolve, reject) => {
            self.client.get(params, function (err, data) {
                if (err) {
                    if (retry)
                        reject(err);
                    else
                        self._solveError(err, params, '_getItem', resolve, reject);
                } else resolve(data.Item);
            });
        });
    }

    async deleteItem(key: any) {
        return this._deleteItem({
            TableName: this.tableName,
            Key: key
        });
    };

    private async _deleteItem(params: any, retry?: boolean) {
        const self = this;
        return new Promise((resolve, reject) => {
            self.client.delete(params, function (err, data) {
                if (err) {
                    if (retry)
                        reject(err);
                    else
                        self._solveError(err, params, '_deleteItem', resolve, reject);
                } else resolve(data.Attributes);
            });
        });
    }

    async storeItems(items: any[]) {
        try {
            const chunks = ArrayHelper.chunk(items, DynamodbEntityConnector.BATCH_SIZE);

            const promises = chunks.map(items => {
                const tableRequest = items.map(item => {
                    return {
                        PutRequest: {
                            Item: this._cleanItem(item)
                        }
                    };
                });

                return this._storeItems({
                    RequestItems: {
                        [this.tableName]: tableRequest
                    }
                });

            });

            await Promise.all(promises);
            console.log("Stored " + items.length + " in " + promises.length + " Promises");
        } catch (e) {
            console.log("EXCEPTION in DynamodbEntityConnector.storeItems for table " + this.tableName, e, e.stack);
            throw Error("EXCEPTION in DynamodbEntityConnector.storeItems for table " + this.tableName);
        }
    };

    private async _storeItems(params: any, retry?: boolean) {
        const self = this;
        return new Promise((resolve, reject) => {
            self.client.batchWrite(params, function (err) {
                if (err) {
                    if (retry)
                        reject(err);
                    else
                        self._solveError(err, params, '_storeItems', resolve, reject);
                } else resolve(true);
            });
        });
    }

    async storeItem(item) {
        item = this._cleanItem(item);

        return this._storeItem({
            TableName: this.tableName,
            Item: item
        });
    };

    private async _storeItem(params: any, retry?: boolean) {
        const self = this;
        return new Promise((resolve, reject) => {
            self.client.put(params, function (err) {
                if (err) {
                    if (retry)
                        reject(err);
                    else
                        self._solveError(err, params, '_storeItem', resolve, reject);
                } else resolve(true);
            });
        });
    }

    async scan(indexName?: string, queryFilter?: any, limit?: number, additionalParams?: any): Promise<AttributeMap[]> {

        const items: AttributeMap[] = [];

        let params = {
            TableName: this.tableName,
            IndexName: indexName,
            ScanFilter: queryFilter,
            Limit: limit,
            ExclusiveStartKey: null
        };

        if (additionalParams) {
            params = Object.assign(params, additionalParams);
        }

        let lastEvaluatedKey = null;

        do {
            params.ExclusiveStartKey = lastEvaluatedKey;
            const response = await this._scan(params);

            lastEvaluatedKey = response.LastEvaluatedKey;
            const currentItems: AttributeMap[] = response.Items;

            currentItems.forEach(item => {
                items.push(item);
            });

        } while (lastEvaluatedKey != null && (limit == undefined || items.length < limit));

        return items;

    }

    private async _scan(params: any, retry?: boolean): Promise<any> {
        const self = this;
        return new Promise((resolve, reject) => {
            self.client.scan(params, function (err, data) {
                if (err) {
                    if (retry)
                        reject(err);
                    else
                        self._solveError(err, params, '_scan', resolve, reject);
                } else resolve(data);
            });
        });
    }

    async query(keyConditions: any, indexName?: string, queryFilter?: any, limit?: number, additionalParams?: any): Promise<AttributeMap[]> {

        const items: AttributeMap[] = [];
        let params = {
            TableName: this.tableName,
            KeyConditions: keyConditions,
            IndexName: indexName,
            QueryFilter: queryFilter,
            Limit: limit,
            ExclusiveStartKey: null
        };

        if (additionalParams) {
            params = Object.assign(params, additionalParams);
        }

        let lastEvaluatedKey = null;

        do {
            params.ExclusiveStartKey = lastEvaluatedKey;
            const response = await this._query(params);

            lastEvaluatedKey = response.LastEvaluatedKey;
            const currentItems: AttributeMap[] = response.Items;

            currentItems.forEach(item => {
                items.push(item);
            });

        } while (lastEvaluatedKey != null && (limit == undefined || items.length < limit));

        return items;
    }

    private async _query(params: any, retry?: boolean): Promise<any> {
        const self = this;
        return new Promise((resolve, reject) => {
            self.client.query(params, function (err, data) {
                if (err) {
                    if (retry)
                        reject(err);
                    else
                        self._solveError(err, params, '_query', resolve, reject);
                } else resolve(data);
            });
        });
    }

    private _cleanItem(item: any) {
        if (!item)
            return null;

        let cleanedItem: any = null;
        if (Array.isArray(item))
            cleanedItem = [];
        else
            cleanedItem = {};

        Object.keys(item).forEach(key => {
            const val = item[key];
            if (typeof val == 'string') {
                if (val != '')
                    cleanedItem[key] = val;
            } else if (typeof val == 'object') {
                cleanedItem[key] = this._cleanItem(val);
            } else {
                cleanedItem[key] = val;
            }
        });

        return cleanedItem;
    }

    async createTable() {
        const attributeDefitions: any[] = [{
            AttributeName: this.partitionKey,
            AttributeType: 'S'
        }];

        const keySchema: any[] = [{
            AttributeName: this.partitionKey,
            KeyType: 'HASH'
        }];

        if (this.sortKey) {
            attributeDefitions.push({
                AttributeName: this.sortKey,
                AttributeType: 'S'
            });
            keySchema.push({
                AttributeName: this.sortKey,
                KeyType: 'RANGE'
            });
        }

        return await this._createTable({
            TableName: this.tableName,
            BillingMode: "PAY_PER_REQUEST",
            AttributeDefinitions: attributeDefitions,
            KeySchema: keySchema
        });

    }

    private async _createTable(params: DynamoDB.Types.CreateTableInput) {
        const client = new AWS.DynamoDB();
        return new Promise((resolve, reject) => {
            client.createTable(params, function (err, data) {
                if (err) reject(err);
                else resolve(data);
            });
        });
    }

    async deleteTable() {
        return await this._deleteTable({
            TableName: this.tableName,
        });

    }

    private async _deleteTable(params: DynamoDB.Types.DeleteTableInput) {
        const client = new AWS.DynamoDB();
        return new Promise((resolve, reject) => {
            client.deleteTable(params, function (err, data) {
                if (err) reject(err);
                else resolve(data);
            });
        });
    }


    async describeTable(): Promise<DynamoDB.Types.TableDescription | undefined> {
        return await this._describeTable({
            TableName: this.tableName
        });
    }

    private async _describeTable(params: DynamoDB.Types.DescribeTableInput): Promise<DynamoDB.Types.TableDescription | undefined> {
        const client = new AWS.DynamoDB();
        return new Promise((resolve, reject) => {
            client.describeTable(params, function (err, data) {
                if (err) reject(err);
                else resolve(data.Table);
            });
        });
    }

    private async _solveError(err: AWSError, params: any, method: string, resolve, reject) {
        try {

            const code = err.code;
            if (code === 'ResourceNotFoundException') {
                await this.createTable();
                console.log('Created table ' + this.tableName);
                await WaitHelper.wait(2500);

                for (let i = 0; i <= 15; i++) {
                    const table = await this.describeTable();
                    if (!table) {
                        reject(err);
                        return;
                    }

                    if (table.TableStatus === 'CREATING' || table.TableStatus === 'UPDATING') {
                        await WaitHelper.wait(2000);
                    } else if (table.TableStatus === 'ACTIVE') {
                        console.log('Table is active after ' + i + ' cycles');
                        break;
                    } else {
                        reject(err);
                        return;
                    }

                    if (i === 15) {
                        console.warn('Timeout in waiting table to be created');
                        reject(err);
                    }
                }

                // retry
                const result = await this[method](params, true);
                resolve(result);
            } else {
                reject(err);
            }

        } catch (e) {
            reject(err);
        }
    }
}
