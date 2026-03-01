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
