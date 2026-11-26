import { createGlobalStyle } from "styled-components";

export default createGlobalStyle`
    body {
        font-family: var(--font-sans);
    }

    ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }

    ::-webkit-scrollbar-track {
        background: transparent;
    }

    ::-webkit-scrollbar-thumb {
        background-color: rgba(255, 255, 255, 0.16);
        border-radius: 9999px;
    }

    ::-webkit-scrollbar-thumb:hover {
        background-color: rgba(255, 255, 255, 0.28);
    }
`;
