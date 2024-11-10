class ApiError extends Error
{
    constructor(
        statusCode,
        errors = [], 
        stack = "", 
        message = "There is a problem "

    )
    {
        super(message);
        this.statusCode = statusCode, 
        this.data = null;
        this.success = false;
        this.errors = errors;
        
        if(stack)
        {
            this.stack = stack;
        }
        else Error.captureStackTrace(this, this.contructor);
    }
};

export {ApiError};