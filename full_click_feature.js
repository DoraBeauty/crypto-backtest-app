        async function showEventCard(event) {
            const targetTime = new Date(event.date).getTime() / 1000;
            const targetTimeMs = targetTime * 1000;

            const currentData = findPriceAfterDays(klineData, targetTime, 0);
            const dailyData = dailyKlineDataCache[currentSymbol] || klineData;
            const day30Data = findPriceAfterDays(dailyData, targetTime, 30);

            const titleEl = document.getElementById('overlay-title');
            const dateEl = document.getElementById('overlay-date');
            const changeEl = document.getElementById('overlay-change');
            const statsEl = document.getElementById('overlay-candle-stats');

            titleEl.innerText = event.name;
            dateEl.innerText = event.date;

            if (currentData && day30Data) {
                const diff = day30Data.close - currentData.close;
                const percent = ((diff / currentData.close) * 100).toFixed(2);
                const isUp = diff >= 0;
                const sign = isUp ? '+' : '';
                changeEl.className = 'event-overlay-change ' + (isUp ? 'up' : 'down');
                changeEl.innerText = `30天後: ${sign}${percent}%`;
            } else {
                changeEl.className = 'event-overlay-change';
                changeEl.innerText = '30天後: 無資料';
                changeEl.style.color = '#787b86';
            }

            if (currentData) {
                const amplitude = ((currentData.high - currentData.low) / currentData.low) * 100;
                const candleChange = currentData.close - currentData.open;
                const candlePercent = (candleChange / currentData.open) * 100;
                const isCandleUp = candleChange >= 0;
                const candleSign = isCandleUp ? '+' : '';
                const candleColor = isCandleUp ? '#00c087' : '#ff4b4b';

                statsEl.innerHTML = `
                    <div style="color: #787b86;">當根K線 (${currentInterval})</div>
                    <div>收盤: $${currentData.close.toLocaleString(undefined, {maximumFractionDigits:0})}</div>
                    <div>漲跌: <span style="color: ${candleColor}">${candleSign}${candlePercent.toFixed(2)}%</span></div>
                    <div>振幅: ${amplitude.toFixed(2)}%</div>
                `;
                statsEl.style.display = 'flex';
            } else {
                statsEl.style.display = 'none';
            }

            currentEventTime = targetTime;
            const overlay = document.getElementById('event-overlay');
            overlay.classList.add('active');
            updateOverlayPosition();
        }
        // Event listener for clicking on the chart to show/hide event cards
        chart.subscribeClick((param) => {
            if (!param || !param.time) {
                // Clicked outside chart data area or no param
                document.getElementById('event-overlay').classList.remove('active');
                currentEventTime = null;
                return;
            }

            // Check if there's a marker near this clicked time
            // The marker is exactly at the event time. If the user clicked exactly on the day,
            // or very close to it (depending on resolution), we show the card.

            // To be precise, since markers are placed exactly at event timestamps,
            // we check if the clicked K-line time matches any event marker.
            let clickedEvent = null;
            let clickedEventTime = null;

            // In smaller timeframes, param.time might be the K-line time, and event time might not align perfectly.
            // We'll see if the clicked time's K-line has a marker (which means the event was mapped to this K-line)
            // But Lightweight Charts doesn't expose markers back easily.
            // Alternatively, we check our events list.

            // Find the closest event within a small window
            const clickedTimeMs = param.time * 1000;
            const threshold = { '15m': 15*60*1000, '1h': 60*60*1000, '4h': 4*60*60*1000, '1d': 24*60*60*1000, '1w': 7*24*60*60*1000 }[currentInterval] || 24*60*60*1000;

            for (let e of events) {
                const eTimeMs = new Date(e.date).getTime();
                // If the clicked K-line time is very close to the event time
                if (Math.abs(eTimeMs - clickedTimeMs) <= threshold) {
                    clickedEvent = e;
                    clickedEventTime = eTimeMs / 1000;
                    break;
                }
            }

            if (clickedEvent) {
                showEventCard(clickedEvent);
            } else {
                // Clicked on empty space (a K-line without an event)
                document.getElementById('event-overlay').classList.remove('active');
                currentEventTime = null;
            }
        });
