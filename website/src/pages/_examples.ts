import exampleHelloWorld from "./_hero-example/ExampleHelloWorld.flyde";
import exampleDebounceThrottle from "./_hero-example/ExampleDebounceThrottle.flyde";
import exampleHttpRequests from "./_hero-example/ExampleHTTPRequests.flyde";
import exampleReactivity from "./_hero-example/ExampleReactivity.flyde";

export const examples = [
  {
    label: "Hello World",
    fileName: "hello.flyde",
    flow: exampleHelloWorld,
    tip: `Try double clicking on the "World" node to change the string.`,
    playgroundUrl:
      "http://play.flyde.dev/apps/bec05712-1fbb-4f40-b688-dc5790c8b5ea",
  },
  {
    label: "Beep Boop",
    fileName: "beep.flyde",
    flow: exampleReactivity,
    tip: `Try changing the collection count and see the output change.`,
    playgroundUrl:
      "https://play.flyde.dev/apps/5860e97d-8e3c-4751-baf2-367bcd768852",
  },
  {
    label: "Debounce/Throttle",
    fileName: "debounce.flyde",
    flow: exampleDebounceThrottle,
    tip: "Try changing the delay time of the debounce/throttle nodes.",
    playgroundUrl:
      "https://play.flyde.dev/apps/f35b90b9-9438-4805-a700-b7eb32c373b2",
  },
  {
    label: "HTTP Requests",
    fileName: "http.flyde",
    flow: exampleHttpRequests,
    tip: `Double click "Format Response" to see how it is implemented.`,
    playgroundUrl:
      "https://play.flyde.dev/apps/c19f558e-e34e-4bad-a47a-58b37968a8b8",
  },
];
