function requireRole(allowedRoles) {
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    const role = req.auth?.role;

    if (!role) {
      return res.status(401).json({ message: "Unauthenticated request" });
    }

    if (!rolesArray.includes(role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }

    return next();
  };
}

module.exports = {
  requireRole,
};
