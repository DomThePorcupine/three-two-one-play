const SP = require('./extension/searchparams');

const sp = new SP('?q=bar&q2=foo');

console.log(sp.get('q'));