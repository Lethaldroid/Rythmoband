import React from 'react';
import styled from 'styled-components';

const Style = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 999;
    width: 100%;
    height: 3px;
    user-select: none;
    pointer-events: none;

    .inner {
        position: relative;
        height: 100%;
        background-color: var(--primary);
        transition: all 0.3s ease 0s;
        span {
            position: absolute;
            top: 3px;
            right: 0;
            padding: 2px 5px;
            color: var(--text-main);
            font-family: var(--font-mono);
            font-size: 12px;
            background-color: rgb(11 11 13 / 90%);
        }
    }
`;

export default function Component({ processing }) {
    return (
        <Style role="progressbar" aria-label="Processing" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(processing)}>
            <div className="inner" style={{ width: `${processing}%` }}>
                <span>{`${processing.toFixed(2)}%`}</span>
            </div>
        </Style>
    );
}
