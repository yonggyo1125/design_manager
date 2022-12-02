module.exports = (req, res) => {
    const headers = req.rawHeaders;
    if (!headers) {
        return;
    }

    const options = {
        path : "/",
        httpOnly : true,
    };
    if (process.env.NODE_ENV === 'production') {
        options.domain = ".n-mk.kr";
        options.proxy = true;
        options.sameSite='lax';
    }

    res.cookie("SMKSESSID", req.session.id, options);
};