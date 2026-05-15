<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

// 港口节点数据
interface RoutePort {
  nameCn: string;
  nameEn: string;
  eventTime?: string;
  isEsti?: string; // Y=预计(灰色), N=实际
  isCompleted?: boolean;
  isCurrent?: boolean;
}

interface Props {
  ports: RoutePort[];
  totalDays?: number;
  routeName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  totalDays: 0,
  routeName: '航线',
});

const containerRef = ref<HTMLElement>();
const containerWidth = ref(900);

const PORTS_PER_ROW = 5;
const ROW_HEIGHT = 128; // 行高（与 getPortCoords 中的计算一致）

// 将港口分组为行
const portRows = computed<RoutePort[][]>(() => {
  const rows: RoutePort[][] = [];
  for (let i = 0; i < props.ports.length; i += PORTS_PER_ROW) {
    rows.push(props.ports.slice(i, i + PORTS_PER_ROW));
  }
  return rows;
});

// 获取全局索引
const getGlobalIndex = (rowIndex: number, portIndex: number): number => {
  return rowIndex * PORTS_PER_ROW + portIndex;
};

// 获取当前港口索引
const currentPortIndex = computed(() => {
  return props.ports.findIndex(p => p.isCurrent);
});

// 港口样式
const getPortClass = (port: RoutePort): string => {
  if (port.isCompleted) return 'port-dot-completed';
  if (port.isCurrent) return 'port-dot-current';
  return 'port-dot-pending';
};

// 天数/日期样式
const getDaysClass = (port: RoutePort): string => {
  if (port.isEsti === 'Y') return 'days-estimated';
  if (port.isCompleted) return 'days-completed';
  if (port.isCurrent) return 'days-current';
  return 'days-pending';
};

// 格式化日期
const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  return dateStr.substring(0, 10);
};

// SVG 高度
const svgHeight = computed(() => {
  const rowCount = portRows.value.length;
  // port-name(42px) + port-dot-wrapper(16px) + segment-days(约20px) + 行间距(50px)
  return rowCount * 128 + 20;
});

// 计算端口坐标（圆点中心位置）
const getPortCoords = (globalIndex: number) => {
  const padding = 60;
  const usableWidth = containerWidth.value - padding * 2;
  const spacing = usableWidth / (PORTS_PER_ROW - 1);
  
  const row = Math.floor(globalIndex / PORTS_PER_ROW);
  const col = globalIndex % PORTS_PER_ROW;

  // 圆点中心的 y 坐标：
  // port-name min-height(36px) + margin-bottom(6px) + port-dot-wrapper一半(8px) = 50px
  // 每行增加：port-name(42px) + port-dot-wrapper(16px) + segment-days(20px) + margin-bottom(50px) = 128px
  const x = padding + col * spacing;
  const y = 50 + row * 128;

  return { x, y };
};

// 生成路径
const buildPath = (maxIndex: number) => {
  if (maxIndex < 1 || props.ports.length < 2) return '';

  let path = '';
  for (let i = 0; i <= maxIndex && i < props.ports.length; i++) {
    const coords = getPortCoords(i);
    if (i === 0) {
      path += `M ${coords.x} ${coords.y}`;
    } else {
      const prevCoords = getPortCoords(i - 1);
      const prevRow = Math.floor((i - 1) / PORTS_PER_ROW);
      const currRow = Math.floor(i / PORTS_PER_ROW);

      if (currRow !== prevRow) {
        // 换行：C型拐弯（从右侧绕回来的平滑弧形）
        // 使用贝塞尔曲线形成更平滑的C型弧线
        const verticalDistance = coords.y - prevCoords.y;
        // 控制点1：从上一行最后一个点向右延伸，并向下移动一部分距离
        const cp1x = prevCoords.x + 80;
        const cp1y = prevCoords.y + verticalDistance * 0.5;
        // 控制点2：在下一行第一个点的右侧，向上移动一部分距离
        const cp2x = coords.x + 80;
        const cp2y = coords.y - verticalDistance * 0.5;
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${coords.x} ${coords.y}`;
      } else {
        // 同行：直线
        path += ` L ${coords.x} ${coords.y}`;
      }
    }
  }
  return path;
};

// 背景路径（全部港口）
const backgroundPath = computed(() => buildPath(props.ports.length - 1));

// 已完成路径
const completedPath = computed(() => {
  const idx = currentPortIndex.value;
  if (idx <= 0) return '';
  return buildPath(idx);
});

// 箭头位置（在最后一个已完成线段的中点）
const arrowTransform = computed(() => {
  const idx = currentPortIndex.value;
  if (idx <= 0) return '';

  const prevCoords = getPortCoords(idx - 1);
  const currCoords = getPortCoords(idx);

  const midX = (prevCoords.x + currCoords.x) / 2;
  const midY = (prevCoords.y + currCoords.y) / 2;
  const angle = Math.atan2(currCoords.y - prevCoords.y, currCoords.x - prevCoords.x) * 180 / Math.PI;

  return `translate(${midX}, ${midY}) rotate(${angle})`;
});

// 测量容器宽度
onMounted(() => {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.clientWidth || 900;
  }
});
</script>

<template>
  <div class="route-map-container">
    <!-- 标题 -->
    <div class="route-map-header">
      <span class="route-title">官方路径</span>
      <span class="route-note">
        备注：以下为船公司官方公告航线路径，船舶实际靠泊情况请参考 船舶定位 卫星AIS动态数据。
      </span>
    </div>

    <!-- 航线标签 -->
    <div v-if="ports.length > 0" class="route-tags">
      <span class="route-tag">
        <!-- {{ routeName }} -->
        <span class="tag-date">{{ totalDays }}天全程</span>
      </span>
    </div>

    <!-- 航线图 -->
    <div
      v-if="ports.length > 0"
      ref="containerRef"
      class="route-map-content"
    >
      <!-- 港口节点 -->
      <div class="route-ports">
        <div
          v-for="(row, rowIndex) in portRows"
          :key="rowIndex"
          class="route-row"
        >
          <div
            v-for="(port, portIndex) in row"
            :key="`${rowIndex}-${portIndex}`"
            class="port-item"
          >
            <!-- 港口名称（上方） -->
            <div class="port-name">
              <span class="port-name-cn">{{ port.nameCn }}</span>
              <span class="port-name-en">{{ port.nameEn }}</span>
            </div>

            <!-- 港口圆点 -->
            <div class="port-dot-wrapper">
              <div class="port-dot" :class="getPortClass(port)">
                <svg
                  v-if="port.isCompleted"
                  width="8"
                  height="8"
                  viewBox="0 0 8 8"
                  fill="none"
                >
                  <path
                    d="M1.5 4L3.5 6L6.5 2"
                    stroke="white"
                    stroke-width="1.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
            </div>

            <!-- 航行天数/日期 -->
            <div
              v-if="getGlobalIndex(rowIndex, portIndex) < ports.length - 1"
              class="segment-days"
              :class="getDaysClass(port)"
            >
              {{ formatDate(port.eventTime) }}
            </div>
          </div>
        </div>
      </div>

      <!-- SVG 航线 -->
      <svg
        class="route-svg"
        :width="containerWidth"
        :height="svgHeight"
        :viewBox="`0 0 ${containerWidth} ${svgHeight}`"
      >
        <defs>
          <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#1677ff" />
            <stop offset="100%" stop-color="#4096ff" />
          </linearGradient>
        </defs>

        <!-- 未完成航线（灰色虚线） -->
        <path
          :d="backgroundPath"
          fill="none"
          stroke="#e8e8e8"
          stroke-width="2"
          stroke-dasharray="5,3"
        />

        <!-- 已完成航线（蓝色实线） -->
        <path
          v-if="completedPath"
          :d="completedPath"
          fill="none"
          stroke="url(#routeGrad)"
          stroke-width="2.5"
          stroke-linecap="round"
        />

        <!-- 箭头 -->
        <g v-if="arrowTransform" :transform="arrowTransform">
          <polygon points="0,-4 8,0 0,4" fill="#4096ff" />
        </g>
      </svg>
    </div>

    <!-- 空状态 -->
    <div v-else class="route-empty">
      <span>暂无航线数据</span>
    </div>
  </div>
</template>

<style scoped>
.route-map-container {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-top: 16px;
}

/* 标题 */
.route-map-header {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 16px;
}

.route-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.route-note {
  font-size: 12px;
  color: #999;
}

/* 航线标签 */
.route-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 30px;
}

.route-tag {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  background: #e6f4ff;
  border-radius: 4px;
  font-size: 14px;
  color: #1677ff;
}

.tag-date {
  color: #4096ff;
  font-weight: 500;
  margin-left: 8px;
  font-size: 13px;
}

/* 航线内容 */
.route-map-content {
  position: relative;
  min-height: 120px;
}

/* 港口容器 */
.route-ports {
  position: relative;
  z-index: 1;
}

.route-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 50px;
}

.port-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 0;
}

/* 港口名称 */
.port-name {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 6px;
  min-height: 36px;
}

.port-name-cn {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  line-height: 1.4;
  white-space: nowrap;
}

.port-name-en {
  font-size: 11px;
  color: #8c8c8c;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  line-height: 1.4;
  white-space: nowrap;
}

/* 港口圆点 */
.port-dot-wrapper {
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.port-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid #d9d9d9;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.port-dot-completed {
  border-color: #1677ff;
  background: #1677ff;
}

.port-dot-current {
  border-color: #4096ff;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(64, 150, 255, 0.15);
}

.port-dot-pending {
  border-color: #d9d9d9;
  background: #fff;
}

/* 航行天数/日期 */
.segment-days {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 500;
  padding: 0 4px;
}

.days-completed {
  color: #1677ff;
}

.days-current {
  color: #4096ff;
}

.days-pending {
  color: #bfbfbf;
}

.days-estimated {
  color: #bfbfbf;
}

/* SVG */
.route-svg {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 0;
}

/* 空状态 */
.route-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #999;
  font-size: 14px;
}
</style>
