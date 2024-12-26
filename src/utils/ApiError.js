class ApiError extends Error
{
    constructor(
        statusCode,
        message = "There is a problem ",
        errors = [], 
        stack = "", 

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