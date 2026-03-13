function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    if (uri === '/') {
        request.uri = '/index.html';
        return request;
    }
    
    if (!uri.includes('.')) {
        /* Force trailing slash for S3 directory indexes */
        if (!uri.endsWith('/')) {
            return {
                statusCode: 301,
                statusDescription: 'Moved Permanently',
                headers: {
                    'location': { value: uri + '/' }
                }
            };
        }
        request.uri = uri + 'index.html';
    }
    
    return request;
}

const event = {
    request: {
        uri: '/waitlist/'
    }
};

const result = handler(event);
console.log(JSON.stringify(result, null, 2));
