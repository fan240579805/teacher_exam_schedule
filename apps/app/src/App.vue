<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app';

onLaunch(() => {
    console.log('深教考通 App Launch');
});
onShow(() => {
    console.log('深教考通 App Show');
});
onHide(() => {
    console.log('深教考通 App Hide');
});
</script>

<style>
page {
    min-height: 100%;
    background: #f7f4ea;
    color: #1f2933;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

/*
 * uni-app H5 端会把 <button> 包成 <uni-button>，外层 uni-button 自带 background:#f8f8f8 灰底；
 * 内层 button 还会自带 1rpx solid #ccc 的 ::after 伪边，且默认 padding/line-height 会撑高。
 * 这里统一重置内外两层，保证业务样式（背景色/圆角/字色）能直接生效，杜绝"半绿半灰"渐变伪影。
 */
uni-button,
button {
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font-size: inherit;
    line-height: normal;
    text-align: center;
}

uni-button::after,
button::after {
    display: none !important;
    border: none !important;
}

uni-button[disabled],
button[disabled] {
    color: inherit;
    background-color: transparent;
}
</style>
