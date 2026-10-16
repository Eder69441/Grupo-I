const jwt = require("jsonwebtoken")

const protect = (req, res, next) => {
  try {
    const authorization =
      req.headers.authorization

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        message: "No autorizado."
      })
    }

    const token = authorization.split(" ")[1]

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    )

    req.user = decoded

    next()
  } catch (error) {
    console.error(
      "Error de autenticación:",
      error.message
    )

    return res.status(401).json({
      message: "Token inválido o expirado."
    })
  }
}

module.exports = protect