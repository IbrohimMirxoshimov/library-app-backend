module.exports = {
    '*.ts': ['eslint --fix', 'prettier --write'],
    '*.json': ['prettier --write --parser json'],
};
