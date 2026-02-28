import streamlit as st
import yfinance as yf
import pandas as pd
import plotly.graph_objects as go
from datetime import timedelta

# 1. 網頁基本設定
st.set_page_config(page_title="加密貨幣事件回測", page_icon="📈", layout="centered")

st.title("📈 區塊鏈重大事件回測系統")
st.markdown("自動抓取最新價格，提供互動式 K 線圖與歷史大事件回測分析。")

# 2. 側邊欄設定
st.sidebar.header("⚙️ 控制面板")
asset_option = st.sidebar.selectbox("請選擇分析標的：", ("比特幣 (BTC)", "以太幣 (ETH)"))
ticker = "BTC-USD" if "比特幣" in asset_option else "ETH-USD"

# 3. 內建重大事件字典 
macro_events = {
    "COVID-19 股市鎔斷": "2020-03-12",
    "俄烏戰爭爆發": "2022-02-24",
    "FTX 交易所崩盤": "2022-11-06",
    "以巴衝突 (哈瑪斯)": "2023-10-07",
    "比特幣現貨 ETF 通過": "2024-01-10"
}

# 4. 抓取資料並快取 (加速讀取)
@st.cache_data(ttl=3600)
def load_data(t):
    df = yf.download(t, start="2020-01-01", progress=False)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    return df

with st.spinner('正在從公開資料庫獲取最新 K 線與價格...'):
    df = load_data(ticker)

if not df.empty:
    # 5. 繪製專業互動式 K 線圖
    st.subheader(f"📊 {asset_option} 即時互動 K 線圖")
    fig = go.Figure(data=[go.Candlestick(
        x=df.index,
        open=df['Open'],
        high=df['High'],
        low=df['Low'],
        close=df['Close'],
        name="K線"
    )])
    fig.update_layout(
        margin=dict(l=0, r=0, t=0, b=0),
        xaxis_rangeslider_visible=False,
        height=400
    )
    st.plotly_chart(fig, use_container_width=True)

    # 6. 執行回測分析
    st.subheader("🔍 重大歷史事件回測結果")
    results = []
    for event_name, event_date in macro_events.items():
        event_date = pd.to_datetime(event_date)
        
        if event_date not in df.index:
            available_dates = df.index[df.index >= event_date]
            if available_dates.empty: continue
            event_date = available_dates[0]
        
        price_t0 = float(df['Close'].loc[event_date])
        date_t7 = event_date + timedelta(days=7)
        date_t30 = event_date + timedelta(days=30)
        
        price_t7 = float(df['Close'].asof(date_t7))
        price_t30 = float(df['Close'].asof(date_t30))
        
        ret_t7 = ((price_t7 - price_t0) / price_t0) * 100
        ret_t30 = ((price_t30 - price_t0) / price_t0) * 100
        
        results.append({
            '事件名稱': event_name,
            '發生日期': event_date.strftime('%Y-%m-%d'),
            '當下價格': f"${price_t0:,.2f}",
            '7天後變化': f"{ret_t7:+.2f}%",
            '30天後變化': f"{ret_t30:+.2f}%"
        })
    
    st.dataframe(pd.DataFrame(results), use_container_width=True)
    st.success("✅ 系統已更新至最新數據！您可以用手指在圖表上滑動與縮放。")
else:
    st.error("無法取得資料，請稍後再試。")
