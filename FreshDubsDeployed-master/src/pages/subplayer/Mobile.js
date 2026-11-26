import styled from 'styled-components';
import { Translate } from 'react-i18nify';
import './i18n/setup';

const Style = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
    min-height: 50vh;
    padding: 24px 16px;
    text-align: center;
    color: var(--text-muted);
    background-color: var(--bg-main);
`;

export default function Mobile() {
    return (
        <Style role="status">
            <Translate value="MOBILE_TIP" />
        </Style>
    );
}
