export const Loader = ({ minimal }: { minimal?: boolean }) => {
  // <!-- By Sam Herbert (@sherb), for everyone. More @ http://goo.gl/7AJzbL -->
  return (
    <div className={`loader ${minimal ? 'loader-minimal' : ''}`}>
      <svg
        width={minimal ? "12" : "38"}
        height={minimal ? "12" : "38"}
        viewBox="0 0 38 38"
        xmlns="http://www.w3.org/2000/svg"
        stroke={minimal ? "#000" : "#007ec6"}
      >
        <g fill="none" fillRule="evenodd">
          <g transform="translate(1 1)" strokeWidth="2">
            <circle strokeOpacity=".5" cx="18" cy="18" r="18" />
            <path d="M36 18c0-9.94-8.06-18-18-18">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 18 18"
                to="360 18 18"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
          </g>
        </g>
      </svg>
    </div>
  );
};
