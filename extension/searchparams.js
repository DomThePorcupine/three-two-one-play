class SearchParams {
    /**
     * Parse a query string in the form ?q=foo&q2=bar
     * @param {string} search - The query string
     */
    constructor(search) {
        // if(search.length < 4) { // Need at least 4 ?f=b
        //     throw new Error('Query string not long enough!');
        // }

        // Make sure it starts with ?
        // if(search.charAt(0) !== '?') {
        //     throw new Error('Query string needs to start with ?');
        // }

        const query = search.slice(1, search.length);
        const queries = query.split('&');

        const keyValues = [];

        this.backbone = {}

        for(let i = 0; i < queries.length; i++) {
            if(queries[i].indexOf('=') < 1) { // can't be position 1
                this.backbone = {}; // make sure we dont save anything
                // throw new Error('Invalid query, no equal sign ' + queries[i])
                return;
            }

            const [key, value] = queries[i].split('=');
            this.backbone[decodeURI(key)] = decodeURI(value);
        }
    }

    get(key) {
        return this.backbone[key] || null;
    }
}