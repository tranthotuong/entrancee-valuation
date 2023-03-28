let db = require('../db');
/**
 * Tuong.TT 2023-03-28
 * Validate email
 * @param {*} email 
 * @returns 
 */
const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

module.exports = {
    get: async (req, res) => {
        try {
            const selectedRows = await db('users')
            .select('id', 'firstName');
            res.json(selectedRows);       
        } catch (e) {
            console.error(e);
        }
    },
    create: async(req, res) => {
        let data = req.body;
        let statusCode = 200;
        let objectResponse = {};
        try {
            if(data && !(Object.prototype.toString.call(data) == '[object Object]' &&
            JSON.stringify(data) == '{}') && data.hasOwnProperty('email') &&  data.hasOwnProperty('password')){
                if(validateEmail(data.email)){
                    if(data.password.toString().length >=8 && data.password.toString().length <= 20){
                        const insertedRows = await knex('users').insert({ email: data.email, password })
                    }else{
                        statusCode = 400;
                        objectResponse = {status: statusCode, message: 'Password must be between 8-20 characters'};
                    }
                }else{
                    statusCode = 400;
                    objectResponse = {status: statusCode, message: 'Invalid format email'};
                }
            }else{
                statusCode = 400;
                objectResponse = {status: statusCode, message: 'Invalid'};
            }     
        } catch (e) {
            statusCode = 500;
            objectResponse = {status: statusCode, message: e.message};
        }
       
        res.status(statusCode).json(objectResponse);
    }
}