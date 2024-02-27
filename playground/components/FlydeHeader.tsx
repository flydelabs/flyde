import Image from "next/image";
import { UserProfile } from "./UserProfile";

export function FlydeHeader() {
  return (
    <nav className="navbar navbar--fixed-top">
      <div className="navbar__inner">
        <div className="navbar__items">
          <a className="navbar__brand" href="https://www.flyde.dev">
            <div className="navbar__logo">
              <Image
                width={32}
                height={32}
                src="/flyde_icon.png"
                alt="Flyde Logo"
                className="themedImage_sJoq themedImage--light_QcnL"
              />
            </div>
            <b className="navbar__title text--truncate">Flyde</b>
          </a>
          <a
            className="navbar__item navbar__link"
            href="https://www.flyde.dev/docs/"
          >
            Documentation
          </a>
          <a
            href="https://marketplace.visualstudio.com/items?itemName=flyde.flyde-vscode"
            target="_blank"
            rel="noopener noreferrer"
            className="navbar__item navbar__link"
          >
            VSCode Extension
            <svg
              width="13.5"
              height="13.5"
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="iconExternalLink_JhmX"
            >
              <path
                fill="currentColor"
                d="M21 13v10h-21v-19h12v2h-10v15h17v-8h2zm3-12h-10.988l4.035 4-6.977 7.07 2.828 2.828 6.977-7.07 4.125 4.172v-11z"
              ></path>
            </svg>
          </a>
          <a
            href="https://www.trigg.dev?ref=playground"
            target="_blank"
            rel="noopener noreferrer"
            className="navbar__item navbar__link"
          >
            Trigg
            <svg
              width="13.5"
              height="13.5"
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="iconExternalLink_JhmX"
            >
              <path
                fill="currentColor"
                d="M21 13v10h-21v-19h12v2h-10v15h17v-8h2zm3-12h-10.988l4.035 4-6.977 7.07 2.828 2.828 6.977-7.07 4.125 4.172v-11z"
              ></path>
            </svg>
          </a>

          <a
            href="https://github.com/flydehq/flyde"
            target="_blank"
            rel="noopener noreferrer"
            className="navbar__item navbar__link"
          >
            GitHub
            <svg
              width="13.5"
              height="13.5"
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="iconExternalLink_JhmX"
            >
              <path
                fill="currentColor"
                d="M21 13v10h-21v-19h12v2h-10v15h17v-8h2zm3-12h-10.988l4.035 4-6.977 7.07 2.828 2.828 6.977-7.07 4.125 4.172v-11z"
              ></path>
            </svg>
          </a>
        </div>
        <div className="navbar__items navbar__items--right">
          <UserProfile />
          <div className="searchBox_EbZm"></div>
        </div>
      </div>
      <div role="presentation" className="navbar-sidebar__backdrop"></div>
    </nav>
  );
}
