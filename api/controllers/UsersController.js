const db = require("../db");
const bcrypt = require("bcrypt");
const { SALT_ROUNDS } = require("../../variables/auth");
const {
  accessTokenSecret,
  accessTokenLife,
  refreshTokenSize,
} = require("../../variables/jwt");
const randToken = require("rand-token");
const authMethod = require("../../auth/auth.methods");

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
      const selectedRows = await db("users").select(
        db.raw(
          "id, firstName, lastName, email, CONCAT (firstName, ' ',lastName) as displayName"
        )
      );
      res.json({ result: selectedRows });
    } catch (e) {
      console.error(e);
    }
  },
  signUp: async (req, res) => {
    let data = req.body;
    let statusCode = 200;
    let objectResponse = {};
    try {
      if (
        data &&
        !(
          Object.prototype.toString.call(data) == "[object Object]" &&
          JSON.stringify(data) == "{}"
        ) &&
        data.hasOwnProperty("email") &&
        data.hasOwnProperty("password")
      ) {
        if (validateEmail(data.email)) {
          if (
            data.password.toString().length >= 8 &&
            data.password.toString().length <= 20
          ) {
            const selectedEmail = await db("users")
              .select("id", "email")
              .where("email", "=", data.email);
            if (!(selectedEmail && selectedEmail.length > 0)) {
              let passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
              let idInsertedRows = await db("users")
                .insert({
                  email: data.email,
                  password: passwordHash,
                  firstName: data.firstName,
                  lastName: data.lastName,
                })
                .returning("id");
              if (idInsertedRows && idInsertedRows.length > 0) {
                const users = await db("users")
                  .select(
                    db.raw(
                      "id, firstName, lastName, email, CONCAT (firstName, ' ',lastName) as displayName"
                    )
                  )
                  .where("id", "=", idInsertedRows[0]);
                objectResponse = {
                  status: statusCode,
                  results: users,
                };
              }
            } else {
              statusCode = 400;
              objectResponse = {
                status: statusCode,
                message: "Email is available",
              };
            }
          } else {
            statusCode = 400;
            objectResponse = {
              status: statusCode,
              message: "Password must be between 8-20 characters",
            };
          }
        } else {
          statusCode = 400;
          objectResponse = {
            status: statusCode,
            message: "Invalid format email",
          };
        }
      } else {
        statusCode = 400;
        objectResponse = { status: statusCode, message: "Invalid" };
      }
    } catch (e) {
      statusCode = 500;
      objectResponse = { status: statusCode, message: e.message };
    }

    res.status(statusCode).json(objectResponse);
  },

  signIn: async (req, res) => {
    let data = req.body;
    let statusCode = 200;
    let objectResponse = {};
    try {
      if (
        data &&
        !(
          Object.prototype.toString.call(data) == "[object Object]" &&
          JSON.stringify(data) == "{}"
        ) &&
        data.hasOwnProperty("email") &&
        data.hasOwnProperty("password")
      ) {
        if (validateEmail(data.email)) {
          if (
            data.password.toString().length >= 8 &&
            data.password.toString().length <= 20
          ) {
            const selectedEmail = await db("users")
              .select(
                db.raw(
                  "id, password, firstName, lastName, email, CONCAT (firstName, ' ',lastName) as displayName"
                )
              )
              .where("email", "=", data.email);
            if (selectedEmail && selectedEmail.length > 0) {
              let checkPassword = await bcrypt.compare(
                data.password,
                selectedEmail[0].password
              );
              if (checkPassword) {
                let dataForAccessToken = {
                  email: data.email,
                };

                let accessToken = await authMethod.generateToken(
                  dataForAccessToken,
                  accessTokenSecret,
                  accessTokenLife
                );
                if (!accessToken) {
                  statusCode = 401;
                  objectResponse = {
                    status: statusCode,
                    message: "Sign In Fail",
                  };
                }
                let refreshToken = randToken.generate(refreshTokenSize); // tạo 1 refresh token ngẫu nhiên
                let date = new Date(); // Now
                date.setDate(date.getDate() + 30);
                let idInsertedRows = await db("tokens")
                  .insert({
                    userId: selectedEmail[0].id,
                    refreshToken: refreshToken,
                    expiresIn: date,
                  })
                  .returning("id");
                if (idInsertedRows && idInsertedRows.length > 0) {
                  objectResponse = {
                    status: statusCode,
                    results: {
                      ...{
                        id: selectedEmail[0].id,
                        firstName: selectedEmail[0].firstName,
                        lastName: selectedEmail[0].lastName,
                        email: selectedEmail[0].email,
                        displayName: selectedEmail[0].displayName,
                      },
                      ...{ token: accessToken, refreshToken: refreshToken },
                    },
                  };
                } else {
                  statusCode = 400;
                  objectResponse = {
                    status: statusCode,
                    message: "Sign up fail",
                  };
                }
              } else {
                statusCode = 400;
                objectResponse = {
                  status: statusCode,
                  message: "Password incorrect",
                };
              }
            } else {
              statusCode = 400;
              objectResponse = {
                status: statusCode,
                message: "Email does not exist",
              };
            }
          } else {
            statusCode = 400;
            objectResponse = {
              status: statusCode,
              message: "Password must be between 8-20 characters",
            };
          }
        } else {
          statusCode = 400;
          objectResponse = {
            status: statusCode,
            message: "Invalid format email",
          };
        }
      } else {
        statusCode = 400;
        objectResponse = { status: statusCode, message: "Invalid" };
      }
    } catch (e) {
      statusCode = 500;
      objectResponse = { status: statusCode, message: e.message };
    }

    res.status(statusCode).json(objectResponse);
  },

  signOut: async (req, res) => {
    let data = req.body;
    let statusCode = 200;
    let objectResponse = {};
    try {
      if (
        data &&
        !(
          Object.prototype.toString.call(data) == "[object Object]" &&
          JSON.stringify(data) == "{}"
        ) &&
        data.hasOwnProperty("email")
      ) {
        if (validateEmail(data.email)) {
          const selectedEmail = await db("users")
            .select(db.raw("id"))
            .where("email", "=", data.email);
          if (selectedEmail && selectedEmail.length > 0) {
            await db("tokens").where("userId", "=", selectedEmail[0].id).del();
            statusCode = 200;
            objectResponse = {
              status: 200,
            };
          } else {
            statusCode = 400;
            objectResponse = {
              status: statusCode,
              message: "Email does not exist",
            };
          }
        } else {
          statusCode = 400;
          objectResponse = {
            status: statusCode,
            message: "Invalid format email",
          };
        }
      } else {
        statusCode = 400;
        objectResponse = { status: statusCode, message: "Invalid" };
      }
    } catch (e) {
      statusCode = 500;
      objectResponse = { status: statusCode, message: e.message };
    }

    res.status(statusCode).json(objectResponse);
  },

  refreshToken: async (req, res) => {
    let data = req.body;
    let statusCode = 200;
    let objectResponse = {};
    try {
      if (
        data &&
        !(
          Object.prototype.toString.call(data) == "[object Object]" &&
          JSON.stringify(data) == "{}"
        ) &&
        data.hasOwnProperty("refreshToken")
      ) {
        const selectedTokens = await db("tokens")
          .select(db.raw("id, userId"))
          .where("refreshToken", "=", data.refreshToken);
        if (selectedTokens && selectedTokens.length > 0) {
          const selectedEmail = await db("users")
            .select(db.raw("email"))
            .where("id", "=", selectedTokens[0].userId);
          if (selectedEmail && selectedEmail.length > 0) {
            let dataForAccessToken = {
              email: selectedEmail[0].email,
            };

            let accessToken = await authMethod.generateToken(
              dataForAccessToken,
              accessTokenSecret,
              accessTokenLife
            );
            if (!accessToken) {
              statusCode = 401;
              objectResponse = {
                status: statusCode,
                message: "Invalid",
              };
            }
            let refreshToken = randToken.generate(refreshTokenSize); // tạo 1 refresh token ngẫu nhiên
            let date = new Date(); // Now
            date.setDate(date.getDate() + 30);
            let idUpdateRows = await db("tokens")
              .where("userId", "=", selectedTokens[0].userId)
              .update({
                refreshToken: refreshToken,
                expiresIn: date,
              });
            if (idUpdateRows > 0) {
              objectResponse = {
                status: statusCode,
                results: {
                  token: accessToken,
                  refreshToken: refreshToken,
                },
              };
            } else {
              statusCode = 400;
              objectResponse = {
                status: statusCode,
                message: "Invalid",
              };
            }
          } else {
            statusCode = 400;
            objectResponse = {
              status: statusCode,
              message: "Refresh token in the inbound does not exist",
            };
          }
        } else {
          statusCode = 400;
          objectResponse = {
            status: statusCode,
            message: "Refresh token in the inbound does not exist",
          };
        }
      } else {
        statusCode = 400;
        objectResponse = { status: statusCode, message: "Invalid" };
      }
    } catch (e) {
      statusCode = 500;
      objectResponse = { status: statusCode, message: e.message };
    }

    res.status(statusCode).json(objectResponse);
  },
};
