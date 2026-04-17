const sqlite3 = re
//ev

const DataTypes = {
  TEXT: 'TEXT',
  INTEGER: 'INTEGER',
  NULL: 'NULL'
};

class SqliteDatabase {
  constructor(dbFile) {
    this.dbFile = dbFile;
    this.openConnections = 0;
    this.db = null;
  }

  open() {
    if (this.openConnections <= 0) {
      this.db = new sqlite3.Database(this.dbFile);
      this.openConnections = 1;
    } else {
      this.openConnections++;
    }
  }

  close() {
    if (this.openConnections <= 1) {
      if (this.db) this.db.close();
      this.db = null;
      this.openConnections = 0;
    } else {
      this.openConnections--;
    }
  }

  async runSelectQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  async getLastRecord(tableName) {
    const query = `SELECT * FROM ${tableName} ORDER BY Id DESC LIMIT 1`;
    return new Promise((resolve, reject) => {
      this.db.get(query, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  getValues(tableName, filter = null, op = '=') {
    if (!this.db) throw new Error('Database connection is not open.');

    let values = [];
    let filterStr = '1 AND ';
    if (filter) {
      const columnNames = Object.keys(filter);
      if (op === 'IN') {
        for (const columnName of columnNames) {
          if (Array.isArray(filter[columnName]) && filter[columnName].length > 0) {
            filterStr += `${columnName} ${op} (`;
            for (const v of filter[columnName]) {
              filterStr += '?, ';
              values.push(v);
            }
            filterStr = filterStr.slice(0, -2);
            filterStr += ') AND ';
          }
        }
      } else {
        for (const columnName of columnNames) {
          filterStr += `${columnName} ${op} ? AND `;
          values.push(filter[columnName] != null ? filter[columnName] : null);
        }
      }
    }
    filterStr = filterStr.slice(0, -5);

    const query = `SELECT * FROM ${tableName}` + (filterStr ? ` WHERE ${filterStr};` : ';');
    return new Promise((resolve, reject) => {
      const rows = [];
      this.db.each(
        query,
        values,
        function (err, row) {
          if (err) return reject(err);
          rows.push(row);
        },
        function (err, count) {
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  }

  runQuery(query, params = null) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params ? params : [], function (err) {
        if (err) return reject(err);
        resolve({ lastId: this.lastID, changes: this.changes });
      });
    });
  }

  async insertValue(tableName, value) {
    return this.insertValues(tableName, [value]);
  }

  async insertValues(tableName, values) {
    if (!this.db) throw new Error('Database connection is not open.');
    if (!values || !values.length) return { lastId: 0, changes: 0 };

    const columnNames = Object.keys(values[0]);
    let rowValueStr = '';
    const rowValues = [];
    for (const val of values) {
      rowValueStr += '(';
      for (const columnName of columnNames) {
        rowValueStr += '?,';
        rowValues.push(val[columnName] != null ? val[columnName] : null);
      }
      rowValueStr = rowValueStr.slice(0, -1) + '),';
    }
    rowValueStr = rowValueStr.slice(0, -1);

    const query = `INSERT INTO ${tableName}(${columnNames.join(', ')}) VALUES ${rowValueStr}`;
    return this.runQuery(query, rowValues);
  }

  async updateValue(tableName, value, filter = null) {
    if (!this.db) throw new Error('Database connection is not open.');

    let columnNames = Object.keys(value);
    let valueStr = '';
    const values = [];
    for (const columnName of columnNames) {
      valueStr += `${columnName} = ? ,`;
      values.push(value[columnName] != null ? value[columnName] : null);
    }
    valueStr = valueStr.slice(0, -1);

    let filterStr = '1 AND ';
    if (filter) {
      columnNames = Object.keys(filter);
      for (const columnName of columnNames) {
        filterStr += `${columnName} = ? AND `;
        values.push(filter[columnName] != null ? filter[columnName] : null);
      }
    }
    filterStr = filterStr.slice(0, -5);

    const query = `UPDATE ${tableName} SET ${valueStr} WHERE ${filterStr};`;
    return this.runQuery(query, values);
  }

  async deleteValues(tableName, filter = null) {
    if (!this.db) throw new Error('Database connection is not open.');

    let values = [];
    let filterStr = '1 AND ';
    if (filter) {
      const columnNames = Object.keys(filter);
      for (const columnName of columnNames) {
        filterStr += `${columnName} = ? AND `;
        values.push(filter[columnName] != null ? filter[columnName] : null);
      }
    }
    filterStr = filterStr.slice(0, -5);

    const query = `DELETE FROM ${tableName} WHERE ${filterStr};`;
    return this.runQuery(query, values);
  }

  async findById(tableName, id) {
    if (!this.db) throw new Error('Database connection is not open.');
    const query = `SELECT * FROM ${tableName} WHERE Id = ${id}`;
    return new Promise((resolve, reject) => {
      this.db.get(query, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }
}

module.exports = { SqliteDatabase, DataTypes };
