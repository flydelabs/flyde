import { defaultProps, IconProps } from "./types";

export const SendIcon = (props: IconProps) => {
  const { size, strokeWidth, ...rest } = { ...defaultProps, ...props };
  return <svg xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" {...rest}><path d="M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z" /><path d="M6 12h16" /></svg >
};
