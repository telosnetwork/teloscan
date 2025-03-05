interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ethereum: any,
    teloscanHCaptchaSuccessHandler?: (token: string) => void,
    teloscanHCaptchaLoadHandler?: () => void
}
