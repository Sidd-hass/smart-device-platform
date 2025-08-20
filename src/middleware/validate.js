export const validateBody = schema => (req,res,next) => {
  try {
    req.validated = schema.parse(req.body);
    next();
  } catch (err) {
    return res.status(400).json({ success:false, message: err.errors?.map(e=>e.message).join(', ') || err.message });
  }
};
