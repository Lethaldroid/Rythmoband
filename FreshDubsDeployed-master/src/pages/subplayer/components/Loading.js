import React from "react";
import styled from "styled-components";
import { t } from "react-i18nify";

const Loading = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 99;
  display: flex;
  justify-content: center;
  align-items: center;
  -webkit-backdrop-filter: saturate(180%) blur(2px);
  backdrop-filter: saturate(180%) blur(2px);
  background-color: rgba(0, 0, 0, 0.5);

  .loading-inner {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    width: 200px;
    height: 200px;
    padding: 0 10px;
    border-radius: 10px;
    color: var(--text-main);
    text-align: center;
    background-color: var(--bg-raised);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-lg);

    img {
      zoom: 0.5;
      margin-bottom: 10px;
    }
  }
`;

export default function Component({ loading }) {
  return (
    <Loading role="status" aria-live="polite">
      <div className="loading-inner">
        <img src="/loading.svg" alt="" />
        <div>{loading || t("LOADING")}</div>
      </div>
    </Loading>
  );
}
