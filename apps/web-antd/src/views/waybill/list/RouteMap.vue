<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';

// 港口节点数据
interface RoutePort {
  nameCn: string;
  nameEn: string;
  eventTime?: string;
  isEsti?: string; // Y=预计(灰色), N=实际
  isCompleted?: boolean;
  isCurrent?: boolean;
  eventPlace?: string; // 事件发生地点
  transportMode?: string; // 运输方式（如海运、空运等）
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
const portDotRefs = ref<Record<number, HTMLElement>>({});
const measuredPortCoords = ref<Record<number, { x: number; y: number }>>({});

const PORTS_PER_ROW = 5;
const ROW_HEIGHT = 128; // 行高（与 getPortCoords 中的计算一致）

interface DisplayPort {
  port: RoutePort;
  globalIndex: number;
}

interface ArrowSegmentInfo {
  anchorIndex: number;
  neighborIndex: number;
  pointX: number;
  pointY: number;
  angle: number;
  shouldExtendPath: boolean;
  pathExtension: string;
}

// 将港口分组为行
const portRows = computed<DisplayPort[][]>(() => {
  const rows: DisplayPort[][] = [];
  for (let i = 0; i < props.ports.length; i += PORTS_PER_ROW) {
    const rowIndex = Math.floor(i / PORTS_PER_ROW);
    const row = props.ports.slice(i, i + PORTS_PER_ROW).map((port, offset) => ({
      port,
      globalIndex: i + offset,
    }));

    // 1-based 奇数行(0-based 偶数行)从左到右，偶数行从右到左
    rows.push(rowIndex % 2 === 0 ? row : row.toReversed());
  }
  return rows;
});

const setPortDotRef = (index: number, el: unknown) => {
  let dom: HTMLElement | null = null;

  if (el instanceof HTMLElement) {
    dom = el;
  } else if (el && typeof el === 'object' && '$el' in el) {
    const componentEl = (el as { $el?: unknown }).$el;
    if (componentEl instanceof HTMLElement) {
      dom = componentEl;
    }
  }

  if (dom) {
    portDotRefs.value[index] = dom;
    return;
  }

  delete portDotRefs.value[index];
};

const updateLayoutMetrics = () => {
  if (!containerRef.value) return;

  containerWidth.value = containerRef.value.clientWidth || 900;

  const containerRect = containerRef.value.getBoundingClientRect();
  const coords: Record<number, { x: number; y: number }> = {};

  Object.entries(portDotRefs.value).forEach(([index, el]) => {
    const rect = el.getBoundingClientRect();
    coords[Number(index)] = {
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top + rect.height / 2,
    };
  });

  measuredPortCoords.value = coords;
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
  return rowCount * ROW_HEIGHT + 20;
});

// 计算端口坐标（圆点中心位置）
const getPortCoords = (globalIndex: number) => {
  const measured = measuredPortCoords.value[globalIndex];
  if (measured) return measured;

  const padding = 60;
  const usableWidth = containerWidth.value - padding * 2;
  const spacing = usableWidth / (PORTS_PER_ROW - 1);
  
  const row = Math.floor(globalIndex / PORTS_PER_ROW);
  const rawCol = globalIndex % PORTS_PER_ROW;
  const col = row % 2 === 0 ? rawCol : PORTS_PER_ROW - 1 - rawCol;

  // 圆点中心的 y 坐标：
  // port-name min-height(36px) + margin-bottom(6px) + port-dot-wrapper一半(8px) = 50px
  // 每行增加：port-name(42px) + port-dot-wrapper(16px) + segment-days(20px) + margin-bottom(50px) = 128px
  const x = padding + col * spacing;
  const y = 50 + row * ROW_HEIGHT;

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
        // 换行：使用双圆角连接（水平 -> 垂直 -> 水平），避免单段贝塞尔在拐点处突兀
        const outerOffset = Math.max(64, Math.min(96, Math.abs(coords.x - prevCoords.x) * 0.2));
        // 行间拐弯方向交替：1->2 行右拐，2->3 行左拐，之后重复
        const isRightTurn = prevRow % 2 === 0;
        const outerX = isRightTurn
          ? Math.min(containerWidth.value - 20, Math.max(prevCoords.x, coords.x) + outerOffset)
          : Math.max(20, Math.min(prevCoords.x, coords.x) - outerOffset);

        const verticalDirection = coords.y >= prevCoords.y ? 1 : -1;
        const verticalDistance = Math.abs(coords.y - prevCoords.y);
        const cornerRadius = Math.max(12, Math.min(24, verticalDistance * 0.22));

        const firstHorizontalDirection = outerX >= prevCoords.x ? 1 : -1;
        const secondHorizontalDirection = coords.x >= outerX ? 1 : -1;

        const firstCornerStartX = outerX - firstHorizontalDirection * cornerRadius;
        const firstCornerEndY = prevCoords.y + verticalDirection * cornerRadius;
        const secondCornerStartY = coords.y - verticalDirection * cornerRadius;
        const secondCornerEndX = outerX + secondHorizontalDirection * cornerRadius;

        path += ` L ${firstCornerStartX} ${prevCoords.y}`;
        path += ` Q ${outerX} ${prevCoords.y}, ${outerX} ${firstCornerEndY}`;
        path += ` L ${outerX} ${secondCornerStartY}`;
        path += ` Q ${outerX} ${coords.y}, ${secondCornerEndX} ${coords.y}`;
        path += ` L ${coords.x} ${coords.y}`;
      } else {
        // 同行：直线
        path += ` L ${coords.x} ${coords.y}`;
      }
    }
  }
  return path;
};

const getArrowSegmentInfo = (): ArrowSegmentInfo | null => {
  const anchorIndex = lastActualPortIndex.value;
  if (anchorIndex < 0 || props.ports.length < 2) return null;

  const preferredNeighbor = anchorIndex + 1;
  const fallbackNeighbor = anchorIndex - 1;

  let neighborIndex = -1;
  if (preferredNeighbor < props.ports.length) {
    neighborIndex = preferredNeighbor;
  } else if (fallbackNeighbor >= 0) {
    neighborIndex = fallbackNeighbor;
  }

  if (neighborIndex < 0) return null;

  const fromIndex = Math.min(anchorIndex, neighborIndex);
  const toIndex = Math.max(anchorIndex, neighborIndex);
  const fromCoords = getPortCoords(fromIndex);
  const toCoords = getPortCoords(toIndex);
  const fromRow = Math.floor(fromIndex / PORTS_PER_ROW);
  const toRow = Math.floor(toIndex / PORTS_PER_ROW);

  const fromPort = props.ports[fromIndex];
  const toPort = props.ports[toIndex];
  const shouldExtendPath =
    anchorIndex === currentPortIndex.value &&
    toIndex === anchorIndex + 1 &&
    fromPort?.isEsti === 'N' &&
    toPort?.isEsti === 'Y';

  let pointX = (fromCoords.x + toCoords.x) / 2;
  let pointY = (fromCoords.y + toCoords.y) / 2;
  let pointAngle = toCoords.x >= fromCoords.x ? 0 : 180;
  let pathExtension = ` L ${pointX} ${pointY}`;

  if (fromRow !== toRow) {
    const outerOffset = Math.max(64, Math.min(96, Math.abs(toCoords.x - fromCoords.x) * 0.2));
    const isRightTurn = fromRow % 2 === 0;
    const outerX = isRightTurn
      ? Math.min(containerWidth.value - 20, Math.max(fromCoords.x, toCoords.x) + outerOffset)
      : Math.max(20, Math.min(fromCoords.x, toCoords.x) - outerOffset);
    const verticalDirection = toCoords.y >= fromCoords.y ? 1 : -1;
    const verticalDistance = Math.abs(toCoords.y - fromCoords.y);
    const cornerRadius = Math.max(12, Math.min(24, verticalDistance * 0.22));
    const firstHorizontalDirection = outerX >= fromCoords.x ? 1 : -1;
    const firstCornerStartX = outerX - firstHorizontalDirection * cornerRadius;
    const firstCornerEndY = fromCoords.y + verticalDirection * cornerRadius;
    const secondCornerStartY = toCoords.y - verticalDirection * cornerRadius;

    pointX = outerX;
    pointY = (firstCornerEndY + secondCornerStartY) / 2;
    pointAngle = verticalDirection > 0 ? 90 : -90;
    pathExtension =
      ` L ${firstCornerStartX} ${fromCoords.y}` +
      ` Q ${outerX} ${fromCoords.y}, ${outerX} ${firstCornerEndY}` +
      ` L ${pointX} ${pointY}`;
  }

  return {
    anchorIndex,
    neighborIndex,
    pointX,
    pointY,
    angle: pointAngle,
    shouldExtendPath,
    pathExtension,
  };
};

// 背景路径（全部港口）
const backgroundPath = computed(() => buildPath(props.ports.length - 1));

// 已完成路径
const completedPath = computed(() => {
  const idx = currentPortIndex.value;
  if (idx <= 0) return '';

  // const lastCompletedIndex = props.ports.findLastIndex(p => p.isCompleted && !p.isCurrent);

  // return buildPath(lastCompletedIndex);
  const path = buildPath(idx);
  const arrowInfo = getArrowSegmentInfo();

  if (!arrowInfo || !arrowInfo.shouldExtendPath || arrowInfo.anchorIndex !== idx) {
    return path;
  }

  return `${path}${arrowInfo.pathExtension}`;
});

// 最后一个实际节点：优先当前节点，其次最后一个已完成节点
const lastActualPortIndex = computed(() => {
  if (currentPortIndex.value >= 0) return currentPortIndex.value;

  for (let i = props.ports.length - 1; i >= 0; i--) {
    if (props.ports[i]?.isCompleted) return i;
  }

  return -1;
});

// 箭头位置：放在最后一个实际节点相邻线段上；方向按行奇偶固定
const arrowTransform = computed(() => {
  const arrowInfo = getArrowSegmentInfo();
  if (!arrowInfo) return '';

  return `translate(${arrowInfo.pointX}, ${arrowInfo.pointY}) rotate(${arrowInfo.angle})`;
});

// 测量容器和圆点中心点
onMounted(() => {
  updateLayoutMetrics();
  window.addEventListener('resize', updateLayoutMetrics);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateLayoutMetrics);
});

watch(
  () => props.ports,
  async () => {
    await nextTick();
    updateLayoutMetrics();
  },
  { deep: true, immediate: true },
);
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
            v-for="item in row"
            :key="item.globalIndex"
            class="port-item"
          >
            <!-- 港口名称（上方） -->
            <div class="port-name">
              <span class="port-name-cn">{{ item.port.nameCn }}</span>
              <span class="port-name-en">{{ item.port.nameEn }}</span>
              <span v-if="item.port.eventPlace" class="port-meta-item">
                {{ item.port.eventPlace }}
              </span>
              <span v-if="item.port.transportMode" class="port-meta-item">
                {{ item.port.transportMode }}
              </span>
            </div>

            <!-- 港口圆点 -->
            <div
              class="port-dot-wrapper"
              :ref="(el) => setPortDotRef(item.globalIndex, el)"
            >
              <div class="port-dot" :class="getPortClass(item.port)">
                <svg
                  v-if="item.port.isCompleted"
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
              class="segment-days"
              :class="getDaysClass(item.port)"
            >
              {{ formatDate(item.port.eventTime) }}
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
          <linearGradient id="routeGrad" gradientUnits="userSpaceOnUse" x1="0%" y1="0%" x2="100%" y2="0%">
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
  min-height: 56px;
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

.port-meta-item {
  font-size: 11px;
  color: #8c8c8c;
  line-height: 1.3;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
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
