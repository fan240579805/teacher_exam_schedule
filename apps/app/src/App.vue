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

button {
    border: 0;
    background: transparent;
    line-height: normal;
}

/* 清除小程序原生 button 自带的 1rpx solid #ccc 细边，避免幽灵边框 */
button::after {
    border: none;
}
</style>
