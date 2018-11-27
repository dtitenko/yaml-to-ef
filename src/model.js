class Schema {
    constructor(doc) {
        this.name = doc.Name;
        this.tables = Object.entries(doc.Tables).map(([name, value]) => new Table(this.name, name, value));
        // add child/parent relations
        this.tables.forEach(table => {
            if (table.parents && table.parents.length) {
                table.parents.forEach(parent => {
                    const parentTable = this.tables.find(t => t.name === parent);
                    parentTable.addChild(table.name);
                });
            }
        });
    }
}

class Table {
    constructor(schema, name, table) {
        this.schema = schema;
        this.name = name;
        this.columns = Object.entries(table.Columns).map(([name, value]) => new Column(name, value));
        this.parents = table.ForeignKeys && table.ForeignKeys.map(key => key.substr(0, key.indexOf('(')));
        this.childs = [];
    }

    addChild(table) {
        this.childs.push(table);
    }
}

class Column {
    constructor(name, type) {
        this.name = name;
        this.type = this._getDotNetType(type);
    }

    _getDotNetType(type) {
        const split = type.split(' ');
        let result = split[0];
        if (split[0] === 'uniqueidentifier') {
            result = 'Guid';
        }

        if (split[0] === 'datetime') {
            result = 'DateTime';
        }

        if (split[0].startsWith('varchar') || split[0].startsWith('nvarchar')) {
            result = 'string';
        }

        if (split.length > 1 && `${split[1]}`.toLowerCase() === 'null') {
            result += '?';
        }
        return result;
    }
}

module.exports = Schema;