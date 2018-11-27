const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const Schema = require('./model')

const sourcePath = path.resolve('.\\schemas');
const outputFolder = path.resolve('.\\.generated');

generate();

function generate() {
    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder);
    }

    const files = fs.readdirSync(sourcePath);
    files.filter(file => file.toLowerCase().endsWith(".yaml")).forEach(file => _generateSchema(sourcePath, file));
}

function _generateSchema(sourcePath, fileName) {
    const yamlFile = path.resolve(sourcePath, fileName);
    const schema = yaml.safeLoad(fs.readFileSync(yamlFile, 'utf8'));
    const model = new Schema(schema);
    const content = _generateTemplate(model);
    fs.writeFile(`.\\.generated\\${model.name}.cs`, content, (err) => {
        if (err) {
            console.error('Error saving generated doc', err);
            return;
        }
        console.log(`Done generating files for ${model.name}.`);
    });
}

function _generateTemplate(model) {
    const classes = model.tables.map(table => _buildClass(table));
    return `// -----------------------------------------------------------------------------------------------------------------
// Auto-generated code. Please do not change manually. Change the yaml file instead and rerun the text transformation.
// -------------------------------------------------------------------------------------------------------------------
namespace YamlToEF.${model.name}
{
    using System;
    ${classes.join('\n')}
}
`;
}

function _buildClass(table) {
    const props = table.columns.map(column => _buildProp(column));
    const collections = table.childs.map(child => _buildCollection(child));
    return `
    [Table("${table.name}", Schema = "${table.schema}")]
    internal class ${table.name}
    {
${props.join('\n')}
${collections.join('\n')}
    }`;
}

function _buildProp(column) {
    return `        public ${column.type} ${column.name} { get; set; }`;
}

function _buildCollection(child) {
    return `        public List<${child}> ${child} { get; set; } = new List<${child}>();`;
}