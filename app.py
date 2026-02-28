import streamlit as st
import yfinance as yf
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from datetime import timedelta

# 1. 網頁基本設定 (改為寬版 layout，更適合看盤，並預設深色風格)
st.set_page_config(page_title="專業級加密貨幣分析", page_icon="📈", layout="wide", initial_sidebar_state="expanded")

# 注入少量 CSS 魔法，讓版面更緊湊、更像 App
st.markdown("""
<style>
    .block-container { padding-top: 1.5rem; padding-bottom: 0rem; }
    h1 { font-weight: 800; font-size: 28px; margin-bottom: 0px;}
</style>
""", unsafe_allow_html=True)

st.title("📈 區塊鏈重大事件分析系統")
st.markdown("專業級 K 線圖表與歷史事件動態跳轉分析。")

# 2. 側邊欄：控制面板與「跳轉遙控器」
st.sidebar.header("⚙️ 控制面板")
asset_option = st.sidebar.selectbox("請選擇分析標的：", ("比特幣 (BTC)", "以太幣 (ETH)"))
ticker = "BTC-USD" if "比特幣" in asset_option else "ETH-USD"

macro_events = {
    "COVID-19 股市鎔斷": "2020-03-12",
    "俄烏戰爭爆發": "2022-02-24",
    "FTX 交易所崩盤": "2022-11-06",
    "以巴衝突 (哈瑪斯)": "2023-10-07",
    "比特幣現貨 ETF 通過": "2024-01-10"
}

# 🟢 UX 升級：點擊事件跳轉選單
selected_event = st.sidebar.selectbox(
    "🎯 快速對焦跳轉至事件：",
    ["查看全局趨勢"] + list(macro_events.keys())
)

# 3. 獲取數據與計算技術指標 (均線)
@st.cache_data(ttl=3600)
def load_data(t):
    df = yf.download(t, start="2020-01-01", progress=False)
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    
    # 計算 5日與 20日均線，讓趨勢一眼判讀
    df['MA5'] = df['Close'].rolling(window=5).mean()
    df['MA20'] = df['Close'].rolling(window=20).mean()
    return df

with st.spinner(f'正在同步 {asset_option} 交易所最新數據...'):
    df = load_data(ticker)

if not df.empty:
    # 4. 繪製專業看盤圖 (上方 K線+均線，下方成交量)
    fig = make_subplots(rows=2, cols=1, shared_xaxes=True, vertical_spacing=0.03, row_heights=[0.8, 0.2])

    # K線圖 (設定國際加密貨幣標準配色：綠漲紅跌)
    fig.add_trace(go.Candlestick(
        x=df.index, open=df['Open'], high=df['High'], low=df['Low'], close=df['Close'],
        name="K線",
        increasing_line_color='#00c087', decreasing_line_color='#ff4b4b'
    ), row=1, col=1)
    
    # 加入均線
    fig.add_trace(go.Scatter(x=df.index, y=df['MA5'], line=dict(color='#4ec9ff', width=1.5), name='MA(5)'), row=1, col=1)
    fig.add_trace(go.Scatter(x=df.index, y=df['MA20'], line=dict(color='#ffcb4e', width=1.5), name='MA(20)'), row=1, col=1)

    # 成交量柱狀圖 (配合漲跌變色)
    colors = ['#ff4b4b' if row['Close'] < row['Open'] else '#00c087' for _, row in df.iterrows()]
    fig.add_trace(go.Bar(x=df.index, y=df['Volume'], name="成交量", marker_color=colors, opacity=0.8), row=2, col=1)

    # 畫上事件垂直標記線
    for event_name, event_date in macro_events.items():
        fig.add_vline(x=event_date, line_width=1.5, line_dash="dot", line_color="rgba(255, 255, 255, 0.5)", row='all', col=1)

    # 🟡 UX 升級：執行畫面跳轉邏輯
    if selected_event != "查看全局趨勢":
        event_date = pd.to_datetime(macro_events[selected_event])
        # 設定跳轉後的視角範圍：事件前 7 天到後 23 天 (共 30 天視角)
        zoom_start = event_date - timedelta(days=7)
        zoom_end = event_date + timedelta(days=23)
        fig.update_xaxes(range=[zoom_start, zoom_end])
        st.subheader(f"🔍 已為您對焦至：{selected_event}")

    # 版面細節最佳化
    fig.update_layout(
        template="plotly_dark",
        margin=dict(l=0, r=0, t=10, b=0),
        xaxis_rangeslider_visible=False, # 關閉底部拖拉條讓畫面更俐落
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1, font_size=12),
        hovermode='x unified' # 十字游標一次顯示所有數據
    )
    
    fig.update_yaxes(title_text="價格 (USD)", tickformat=",.0f", row=1, col=1)
    st.plotly_chart(fig, use_container_width=True)

    # 5. 回測數據表
    st.markdown("### 📊 歷史數據精算")
    results = []
    for event_name, event_date in macro_events.items():
        event_date = pd.to_datetime(event_date)
        if event_date not in df.index:
            available_dates = df.index[df.index >= event_date]
            if available_dates.empty: continue
            event_date = available_dates[0]
        
        price_t0 = float(df['Close'].loc[event_date])
        price_t7 = float(df['Close'].asof(event_date + timedelta(days=7)))
        price_t30 = float(df['Close'].asof(event_date + timedelta(days=30)))
        
        results.append({
            '事件名稱': event_name,
            '發生日期': event_date.strftime('%Y-%m-%d'),
            '當下價格': f"${price_t0:,.0f}",
            '7天後變化': f"{((price_t7 - price_t0) / price_t0) * 100:+.2f}%",
            '30天後變化': f"{((price_t30 - price_t0) / price_t0) * 100:+.2f}%"
        })
    
    st.dataframe(pd.DataFrame(results), use_container_width=True)
else:
    st.error("無法取得資料，請稍後再試。")
