const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

const adminLevel = (level) => {
  return (req, res, next) => {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    if (req.user.adminLevel < level) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient admin privileges',
      });
    }

    next();
  };
};

module.exports = { authorize, adminLevel };