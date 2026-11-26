import styled from 'styled-components';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Table, AutoSizer } from 'react-virtualized';
import unescape from 'lodash/unescape';

const Style = styled.div`
    position: relative;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    box-shadow: 0px 5px 25px 5px rgb(0 0 0 / 60%);
    background-color: var(--bg-surface);
    border-left: 1px solid var(--border);

    .ReactVirtualized__Table {
        .ReactVirtualized__Table__Grid {
            outline: none;
        }

        .ReactVirtualized__Table__row {
            .item {
                height: 100%;
                padding: 5px;

                .textarea {
                    border: none;
                    width: 100%;
                    height: 100%;
                    color: var(--text-main);
                    font-family: var(--font-sans);
                    font-size: 13px;
                    padding: 10px;
                    text-align: center;
                    background-color: var(--bg-raised);
                    border: 1px solid var(--border);
                    border-radius: var(--radius-sm);
                    transition: all 0.2s ease;
                    resize: none;

                    &:focus-visible {
                        outline: 2px solid var(--primary);
                        outline-offset: -2px;
                    }

                    &.highlight {
                        background-color: var(--primary-soft);
                        border: 1px solid var(--primary);
                    }

                    &.illegal {
                        background-color: rgba(255, 92, 108, 0.16);
                        border: 1px solid var(--danger);
                    }
                }
            }
        }
    }
`;

// After the user scrolls the list themselves, stop auto-following the
// playhead for a moment so the list doesn't yank back under their cursor.
const FOLLOW_RESUME_MS = 2500;

function Subtitles({ currentIndex, subtitle, checkSub, player, updateSub }) {
    const [follow, setFollow] = useState(true);
    const resumeTimer = useRef(0);

    const pauseFollow = useCallback(() => {
        setFollow(false);
        clearTimeout(resumeTimer.current);
        resumeTimer.current = setTimeout(() => setFollow(true), FOLLOW_RESUME_MS);
    }, []);

    useEffect(() => () => clearTimeout(resumeTimer.current), []);

    const onListKeyDown = useCallback(
        (event) => {
            if (['PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) pauseFollow();
        },
        [pauseFollow],
    );

    const rowRenderer = useCallback(
        (props) => {
            return (
                <div
                    key={props.key}
                    className={props.className}
                    style={props.style}
                    onClick={() => {
                        setFollow(true);
                        if (player) {
                            player.pause();
                            if (player.duration >= props.rowData.startTime) {
                                player.currentTime = props.rowData.startTime + 0.001;
                            }
                        }
                    }}
                >
                    <div className="item">
                        <textarea
                            maxLength={200}
                            spellCheck={false}
                            aria-label={`Subtitle line ${props.index + 1}`}
                            className={[
                                'textarea',
                                currentIndex === props.index ? 'highlight' : '',
                                checkSub(props.rowData) ? 'illegal' : '',
                            ]
                                .join(' ')
                                .trim()}
                            value={unescape(props.rowData.text)}
                            onChange={(event) => {
                                updateSub(props.rowData, {
                                    text: event.target.value,
                                });
                            }}
                        />
                    </div>
                </div>
            );
        },
        [currentIndex, checkSub, player, updateSub],
    );

    const rowGetter = useCallback(({ index }) => subtitle[index], [subtitle]);

    return (
        <Style
            className="subtitles"
            onWheel={pauseFollow}
            onTouchMove={pauseFollow}
            onKeyDown={onListKeyDown}
        >
            <AutoSizer>
                {({ width, height }) => (
                    <Table
                        headerHeight={0}
                        disableHeader
                        width={width}
                        height={height}
                        rowHeight={80}
                        overscanRowCount={4}
                        scrollToIndex={follow ? currentIndex : -1}
                        scrollToAlignment="center"
                        rowCount={subtitle.length}
                        rowGetter={rowGetter}
                        rowRenderer={rowRenderer}
                    ></Table>
                )}
            </AutoSizer>
        </Style>
    );
}

// The parent re-renders on every animation frame while the video plays;
// only re-render the list when something it shows actually changes.
export default memo(Subtitles);
