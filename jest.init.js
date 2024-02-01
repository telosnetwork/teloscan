const { config } = require('@vue/test-utils');

config.global.mocks = {
    $t: str => str,
};
