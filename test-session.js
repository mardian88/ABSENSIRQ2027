const { auth } = require('./src/lib/auth'); auth.api.getSession({ headers: new Headers() }).then(console.log).catch(console.error);  
