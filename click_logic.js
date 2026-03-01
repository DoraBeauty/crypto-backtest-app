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
