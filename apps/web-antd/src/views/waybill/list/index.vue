<script setup lang="ts">
import { ref, reactive } from 'vue';
import { Card, Button, Modal, Input as AInput, message } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { queryContainerTrack } from '#/api/freetower';
import './styles.css';

interface WaybillNode {
  label: string;
  port?: string;
  times: { label: string; value: string }[];
}

interface Waybill {
  id: string;
  step?: string; // 当前阶段
  companyName: string; // 公司名称
  recipientName: string; // 收货人名称
  originPort: string; // 起运港
  destPort: string; // 目的港
  nodes: WaybillNode[]; // 节点信息
  currentStatus: number; // 当前状态
  statusLabel: string; // 状态标签
  goodsReadyDate: string; // 货好时间
  emptyPickupDate: string; // 提空日期(提空箱) result.containers[0].status[0].eventTime
  returnHeavyDate: string; // 还重日期(进场) result.containers[0].status[1].eventTime
  crd: string; // CRD 货好日，后台人工填写
  etd: string; // ETD
  ata: string; // ATA
  eta: string; // ETA
  deliveryDate: string; // 交付日期
  returnEmptyDate: string; // 返空日期
  billNo?: string; // MBL编号
  containerNo?: string; // 集装箱编号
  carrierCode?: string; // 运输公司代码
  status?: any[];
}

interface ftStatus {
  eventTime: string;
  descriptionCn: string;
  isEsti: string; // N就代表实际发生的节点,Y就说明是 预计发生的
}

// 飞驼的containers.status节点状态是否包含某个状态
// 提空箱: statusHasFlag(result.data.result?.containers[0].status, '提空箱')
// 还重日: statusHasFlag(result.data.result?.containers[0].status, '进场')
// 装船: statusHasFlag(result.data.result?.containers[0].status, '装船')
// 离港: statusHasFlag(result.data.result?.containers[0].status, '离港')
// 中转抵港: statusHasFlag(result.data.result?.containers[0].status, '中转抵港')
// 中转卸船: statusHasFlag(result.data.result?.containers[0].status, '中转卸船')
// 中转离港: statusHasFlag(result.data.result?.containers[0].status, '中转离港')
// 中转抵港: statusHasFlag(result.data.result?.containers[0].status, '中转抵港')
// 中转离港: statusHasFlag(result.data.result?.containers[0].status, '中转离港')
// 交货地抵达: statusHasFlag(result.data.result?.containers[0].status, '交货地抵达')
// 抵港: statusHasFlag(result.data.result?.containers[0].status, '抵港')
// 提柜(货): statusHasFlag(result.data.result?.containers[0].status, '提柜(货)')
// 还空箱: statusHasFlag(result.data.result?.containers[0].status, '还空箱')
function statusHasFlag(status: ftStatus[], descriptionCn: string) {
  const rs = status.find((item) => item.descriptionCn === descriptionCn);
  if (rs) {
    return {
      eventTime: rs.eventTime,
      descriptionCn: rs.descriptionCn,
      isEsti: rs.isEsti, // N就代表实际发生的节点,Y就说明是 预计发生的
    };
  }
  return null;
}

function getLastFlag(status: ftStatus[]) {
  const rs = status[status.length - 1];
  return {
    eventTime: rs?.eventTime,
    descriptionCn: rs?.descriptionCn,
    isEsti: rs?.isEsti, // N就代表实际发生的节点,Y就说明是 预计发生的
  };
}

const waybills = ref<Waybill[]>([
  {
    id: '1',
    companyName: '广州市尚雷仕卫浴有限公司',
    recipientName: 'SUPERIOR WELLNESS LTD',
    originPort: 'YANTIAN',
    destPort: 'ROTTERDAM',
    currentStatus: 1,
    statusLabel: '1、等待到达起运港',
    goodsReadyDate: '2026-05-01',
    emptyPickupDate: '2026-05-05',
    etd: '2026-05-11',
    ata: '',
    eta: '2026-06-20',
    deliveryDate: '',
    returnEmptyDate: '',
    billNo: 'CHN3298224',
    containerNo: 'SEGU5065045',
    carrierCode: 'CMA',
    nodes: [
      {
        label: '公司名称',
        times: [
          { label: '货好时间', value: '2026-05-01' },
          { label: '提空日期', value: '2026-05-05' },
        ],
      },
      {
        label: '起运港',
        port: 'YANTIAN',
        times: [{ label: 'ETD', value: '2026-05-11' }],
      },
      {
        label: '目的港',
        port: 'ROTTERDAM',
        times: [{ label: 'ETA', value: '2026-06-20' }],
      },
      { label: '收货人名称', times: [] },
    ],
    returnHeavyDate: '',
    crd: '',
  },
  {
    id: '2',
    companyName: '广州市尚雷仕卫浴有限公司',
    recipientName: 'SUPERIOR WELLNESS LTD',
    originPort: 'YANTIAN',
    destPort: 'ROTTERDAM',
    currentStatus: 2,
    statusLabel: '2、已到达起运港',
    goodsReadyDate: '2026-05-01',
    emptyPickupDate: '2026-05-05',
    etd: '2026-05-11',
    ata: '',
    eta: '2026-06-20',
    deliveryDate: '',
    returnEmptyDate: '',
    billNo: 'WHLC026G516022',
    containerNo: 'WHSU5907860',
    carrierCode: 'WHL',
    nodes: [
      {
        label: '公司名称',
        times: [
          { label: '货好时间', value: '2026-05-01' },
          { label: '提空日期', value: '2026-05-05' },
        ],
      },
      {
        label: '起运港',
        port: 'YANTIAN',
        times: [{ label: 'ETD', value: '2026-05-11' }],
      },
      {
        label: '目的港',
        port: 'ROTTERDAM',
        times: [{ label: 'ETA', value: '2026-06-20' }],
      },
      { label: '收货人名称', times: [] },
    ],
    returnHeavyDate: '',
    crd: '',
  },
  {
    id: '3',
    companyName: '广州市尚雷仕卫浴有限公司',
    recipientName: 'SUPERIOR WELLNESS LTD',
    originPort: 'YANTIAN',
    destPort: 'ROTTERDAM',
    currentStatus: 3,
    statusLabel: '3、前往目的港途中',
    goodsReadyDate: '2026-05-01',
    emptyPickupDate: '2026-05-05',
    etd: '2026-05-11',
    ata: '',
    eta: '2026-06-20',
    deliveryDate: '',
    returnEmptyDate: '',
    billNo: 'WHLC026G516022',
    containerNo: 'WHSU5907860',
    carrierCode: 'WHL',
    nodes: [
      {
        label: '公司名称',
        times: [
          { label: '货好时间', value: '2026-05-01' },
          { label: '提空日期', value: '2026-05-05' },
        ],
      },
      {
        label: '起运港',
        port: 'YANTIAN',
        times: [{ label: 'ATD', value: '2026-05-13' }],
      },
      {
        label: '目的港',
        port: 'ROTTERDAM',
        times: [{ label: 'ETA', value: '2026-06-20' }],
      },
      { label: '收货人名称', times: [] },
    ],
    returnHeavyDate: '',
    crd: '',
  },
  {
    id: '4',
    companyName: '广州市尚雷仕卫浴有限公司',
    recipientName: 'SUPERIOR WELLNESS LTD',
    originPort: 'YANTIAN',
    destPort: 'ROTTERDAM',
    currentStatus: 4,
    statusLabel: '4、已到达目的港',
    goodsReadyDate: '2026-05-01',
    emptyPickupDate: '2026-05-05',
    etd: '2026-05-11',
    ata: '2026-06-25',
    eta: '2026-06-20',
    deliveryDate: '',
    returnEmptyDate: '',
    billNo: 'COSU6443291380',
    containerNo: 'TLLU7834064',
    carrierCode: 'COSCO',
    nodes: [
      {
        label: '公司名称',
        times: [
          { label: '货好时间', value: '2026-05-01' },
          { label: '提空日期', value: '2026-05-05' },
        ],
      },
      {
        label: '起运港',
        port: 'YANTIAN',
        times: [{ label: 'ATD', value: '2026-05-13' }],
      },
      {
        label: '目的港',
        port: 'ROTTERDAM',
        times: [{ label: 'ATA', value: '2026-06-25' }],
      },
      { label: '收货人名称', times: [] },
    ],
    returnHeavyDate: '',
    crd: '',
  },
  {
    id: '5',
    companyName: '广州市尚雷仕卫浴有限公司',
    recipientName: 'SUPERIOR WELLNESS LTD',
    originPort: 'YANTIAN',
    destPort: 'ROTTERDAM',
    currentStatus: 5,
    statusLabel: '5、尾端派送',
    goodsReadyDate: '2026-05-01',
    emptyPickupDate: '2026-05-05',
    etd: '2026-05-11',
    ata: '2026-06-25',
    eta: '2026-06-20',
    deliveryDate: '2026-06-29',
    returnEmptyDate: '2026-06-29',
    billNo: 'WHLC026G516022',
    containerNo: 'WHSU5907860',
    carrierCode: 'WHL',
    nodes: [
      {
        label: '公司名称',
        times: [
          { label: '货好时间', value: '2026-05-01' },
          { label: '提空日期', value: '2026-05-05' },
        ],
      },
      {
        label: '起运港',
        port: 'YANTIAN',
        times: [{ label: 'ATD', value: '2026-05-13' }],
      },
      {
        label: '目的港',
        port: 'ROTTERDAM',
        times: [
          { label: 'ATA', value: '2026-06-25' },
          { label: '提空日期', value: '2026-06-28' },
        ],
      },
      { label: '收货人名称', times: [] },
    ],
    returnHeavyDate: '',
    crd: '',
  },
  {
    id: '6',
    companyName: '广州市尚雷仕卫浴有限公司',
    recipientName: 'SUPERIOR WELLNESS LTD',
    originPort: 'YANTIAN',
    destPort: 'ROTTERDAM',
    currentStatus: 6,
    statusLabel: '6、已送达',
    goodsReadyDate: '2026-05-01',
    emptyPickupDate: '2026-05-05',
    etd: '2026-05-11',
    ata: '2026-06-25',
    eta: '2026-06-20',
    deliveryDate: '2026-06-29',
    returnEmptyDate: '2026-06-29',
    billNo: 'WHLC026G516022',
    containerNo: 'WHSU5907860',
    carrierCode: 'WHL',
    nodes: [
      {
        label: '公司名称',
        times: [
          { label: '货好时间', value: '2026-05-01' },
          { label: '提空日期', value: '2026-05-05' },
        ],
      },
      {
        label: '起运港',
        port: 'YANTIAN',
        times: [{ label: 'ATD', value: '2026-05-13' }],
      },
      {
        label: '目的港',
        port: 'ROTTERDAM',
        times: [
          { label: 'ATA', value: '2026-06-25' },
          { label: '提空日期', value: '2026-06-28' },
        ],
      },
      {
        label: '收货人名称',
        times: [
          { label: '派送日期', value: '2026-06-29' },
          { label: '还空日期', value: '2026-06-29' },
        ],
      },
    ],
    returnHeavyDate: '',
    crd: '',
  },
]);

const ft_waybill = ref<Waybill>({
  id: '',
  companyName: '',
  recipientName: '',
  originPort: '',
  destPort: '',
  nodes: [],
  currentStatus: 0,
  statusLabel: '',
  goodsReadyDate: '',
  emptyPickupDate: '',
  returnHeavyDate: '',
  crd: '',
  etd: '',
  ata: '',
  eta: '',
  deliveryDate: '',
  returnEmptyDate: '',
  billNo: '',
  containerNo: '',
  carrierCode: '',
  status: [],
} as Waybill); // 初始化一个完整的 Waybill 对象

const detailVisible = ref(false);
const selectedWaybill = ref<Waybill | null>(null);
const isEditing = ref(false);
const editingWaybill = ref<Waybill | null>(null);

// 创建一个响应式的编辑对象
const editForm = reactive<Partial<Waybill>>({});

function viewDetail(waybill: Waybill) {
  selectedWaybill.value = waybill;
  editingWaybill.value = JSON.parse(JSON.stringify(waybill));
  // 同步到 editForm
  Object.assign(editForm, waybill);
  isEditing.value = true;
  detailVisible.value = true;
}

function cancelEdit() {
  isEditing.value = false;
  detailVisible.value = false;
  // 清空 editForm
  Object.keys(editForm).forEach((key) => delete editForm[key as keyof Waybill]);
}

function saveEdit() {
  if (selectedWaybill.value && editingWaybill.value) {
    const index = waybills.value.findIndex(
      (w) => w.id === selectedWaybill.value?.id,
    );
    if (index !== -1) {
      // 从 editForm 和 editingWaybill 合并创建新对象
      const updatedWaybill = {
        ...editingWaybill.value,
        ...editForm,
      } as Waybill;

      // ft_waybill.value = { ...editingWaybill.value, ...editForm } as Waybill;

      // 同步更新 nodes 数组中的数据
      if (updatedWaybill.nodes) {
        // 节点0: 公司名称的货好时间和提空日期
        if (updatedWaybill.nodes[0] && updatedWaybill.nodes[0].times) {
          // 查找并更新货好时间
          const goodsReadyTime = updatedWaybill.nodes[0].times.find(
            (t) => t.label === '货好时间',
          );
          if (goodsReadyTime) {
            goodsReadyTime.value =
              updatedWaybill.goodsReadyDate || goodsReadyTime.value;
          }
          // 查找并更新提空日期
          const pickupTime = updatedWaybill.nodes[0].times.find(
            (t) => t.label === '提空日期',
          );
          if (pickupTime) {
            pickupTime.value =
              updatedWaybill.emptyPickupDate || pickupTime.value;
          }
        }
        // 节点1: 起运港和ETD/ATD
        if (updatedWaybill.nodes[1]) {
          updatedWaybill.nodes[1].port = updatedWaybill.originPort;
          if (updatedWaybill.nodes[1].times[0]) {
            updatedWaybill.nodes[1].times[0].value =
              updatedWaybill.etd || updatedWaybill.nodes[1].times[0].value;
          }
        }
        // 节点2: 目的港和ETA/ATA
        if (updatedWaybill.nodes[2]) {
          updatedWaybill.nodes[2].port = updatedWaybill.destPort;
          if (updatedWaybill.nodes[2].times[0]) {
            updatedWaybill.nodes[2].times[0].value =
              updatedWaybill.ata ||
              updatedWaybill.eta ||
              updatedWaybill.nodes[2].times[0].value;
          }
          // 查找并更新节点2中的提空日期（目的港提空）
          const destPickupTime = updatedWaybill.nodes[2].times.find(
            (t) => t.label === '提空日期',
          );
          if (destPickupTime) {
            destPickupTime.value =
              updatedWaybill.returnEmptyDate || destPickupTime.value;
          }
        }
        // 节点3: 收货人的派送日期和还空日期
        if (updatedWaybill.nodes[3] && updatedWaybill.nodes[3].times) {
          // 查找并更新派送日期
          const deliveryTime = updatedWaybill.nodes[3].times.find(
            (t) => t.label === '派送日期',
          );
          if (deliveryTime) {
            deliveryTime.value =
              updatedWaybill.deliveryDate || deliveryTime.value;
          }
          // 查找并更新还空日期
          const returnTime = updatedWaybill.nodes[3].times.find(
            (t) => t.label === '还空日期',
          );
          if (returnTime) {
            returnTime.value =
              updatedWaybill.returnEmptyDate || returnTime.value;
          }
        }
      }

      // 创建新数组触发响应式更新
      const newWaybills = waybills.value.map((item, i) =>
        i === index ? updatedWaybill : item,
      );
      waybills.value = newWaybills;
    }
    isEditing.value = false;
    detailVisible.value = false;
    // 清空 editForm
    Object.keys(editForm).forEach(
      (key) => delete editForm[key as keyof Waybill],
    );
  }
}

async function searchContainer() {
  if (!editForm.containerNo) {
    message.warning('请先输入集装箱号');
    return;
  }

  try {
    message.loading({
      content: '正在查询集装箱信息...',
      key: 'container-search',
    });

    // 使用 trackContainer API，传递完整的参数
    const result = await queryContainerTrack(
      editForm.containerNo,
      editForm.billNo,
      editForm.carrierCode,
    );

    if (result.statusCode === 20000 || result.statusCode === 0) {
      message.success({ content: '查询成功', key: 'container-search' });
      console.log('集装箱跟踪结果:', result);

      // 可以在这里显示查询结果
      if (result.data?.result) {
        message.info(
          `找到 ${Array.isArray(result.data.result) ? result.data.result.length : 1} 条跟踪记录`,
        );
        // selectedWaybill

        // ft_waybill.value = { ...editingWaybill.value, ...editForm } as Waybill;

        ft_waybill.value = {
          ...editingWaybill.value,
          ...editForm,
          step: getLastFlag(result.data.result?.containers[0].status)[
            'descriptionCn'
          ],
          status: result.data.result?.containers[0].status,
          emptyPickupDate:
            result.data.result?.containers[0].status[0].eventTime,
          returnHeavyDate:
            result.data.result?.containers[0].status[1].eventTime,
          // 初始化 nodes 数组结构
          nodes: [
            {
              label: '公司名称',
              times: [
                { label: '货好时间', value: editForm.goodsReadyDate || '' },
                {
                  label: '提空日期',
                  value:
                    result.data.result?.containers[0].status[0].eventTime || '',
                },
              ],
            },
            {
              label: '起运港',
              port: editForm.originPort || '',
              times: [
                {
                  label: '还重日期',
                  value:
                    result.data.result?.containers[0].status[1].eventTime || '',
                },
                { label: 'ETD', value: editForm.etd || '' },
              ],
            },
            {
              label: '目的港',
              port: editForm.destPort || '',
              times: [{ label: 'ETA', value: editForm.eta || '' }],
            },
            { label: '收货人名称', times: [] },
          ],
        } as Waybill;

        // emptyPickupDate: string;// 提空日期(提空箱) result.containers[0].status[0].eventTime
        // returnHeavyDate: string;// 还重日期(进场) result.containers[0].status[1].eventTime
        // ft_waybill.value.status = result.data.result?.containers[0].status;
        // ft_waybill.value.emptyPickupDate = result.data.result?.containers[0].status[0].eventTime;
        // ft_waybill.value.returnHeavyDate = result.data.result?.containers[0].status[1].eventTime;
        console.log('更新后台的ft_waybill', ft_waybill.value);
        console.log(
          '是否包含指定状态',
          '提空箱',
          statusHasFlag(result.data.result?.containers[0].status, '提空箱'),
        );
      }
    } else {
      message.error({
        content: result.message || '查询失败',
        key: 'container-search',
      });
    }
  } catch (error) {
    console.error('集装箱查询失败:', error);
    message.error({
      content: '查询失败，请检查网络连接或联系管理员',
      key: 'container-search',
    });
  }
}

/**
 * 计算每个节点的进度状态
 */
function getNodeStatus(waybill: Waybill, nodeIndex: number): string {
  const status = waybill.currentStatus;
  switch (status) {
    case 1:
      return nodeIndex === 0 ? 'active' : 'inactive';
    case 2:
      return nodeIndex < 2 ? 'completed' : 'inactive';
    case 3:
      if (nodeIndex < 2) return 'completed';
      if (nodeIndex === 2) return 'active';
      return 'inactive';
    case 4:
      return nodeIndex < 3 ? 'completed' : 'inactive';
    case 5:
      if (nodeIndex < 3) return 'completed';
      if (nodeIndex === 3) return 'active';
      return 'inactive';
    case 6:
      return 'completed';
    default:
      return 'inactive';
  }
}

/**
 * 计算连接线的状态
 */
function getSegmentStatus(waybill: Waybill, segmentIndex: number): string {
  const status = waybill.currentStatus;
  switch (status) {
    case 1:
      return 'inactive';
    case 2:
      return segmentIndex < 1 ? 'active' : 'inactive';
    case 3:
      if (segmentIndex === 0) return 'active';
      if (segmentIndex === 1) return 'half';
      return 'inactive';
    case 4:
      return segmentIndex < 2 ? 'active' : 'inactive';
    case 5:
      if (segmentIndex < 2) return 'active';
      if (segmentIndex === 2) return 'half';
      return 'inactive';
    case 6:
      return 'active';
    default:
      return 'inactive';
  }
}
</script>

<template>
  <div class="waybill-page">
    <div class="waybill-page-header">
      <h1 class="waybill-page-title">运单列表</h1>
    </div>

    <div class="detail-section">
      <h3>运输信息</h3>
      <div class="detail-grid">
        <div class="detail-item">
          <span class="detail-label">MBL号</span>
          <a-input v-model:value="editForm.billNo" placeholder="请输入MBL号" />
        </div>
        <div class="detail-item">
          <span class="detail-label">集装箱号</span>
          <a-input
            v-model:value="editForm.containerNo"
            placeholder="请输入集装箱号"
            style="flex: 1"
          />
        </div>
        <div class="detail-item">
          <span class="detail-label">船公司代码</span>
          <a-input
            v-model:value="editForm.carrierCode"
            placeholder="请输入船公司代码"
          />
        </div>
        <div class="detail-item">
          <span class="detail-label">箱号和船公司必填</span>
          <Button type="primary" @click="searchContainer">
            <template #icon>
              <IconifyIcon icon="lucide:search" />
            </template>
            查询飞驼数据
          </Button>
        </div>
      </div>
    </div>

    <div class="waybill-list">
      <Card
        v-for="waybill in waybills"
        :key="waybill.id"
        :bordered="false"
        class="waybill-card"
        @click="viewDetail(waybill)"
      >
        <span class="waybill-status-label">{{ waybill.statusLabel }}</span>

        <!-- 横向进度条 - 箭头连线 -->
        <div class="shipping-progress">
          <!-- 左侧：公司名称 -->
          <div class="progress-company-info">
            <span class="company-name">{{ waybill.companyName }}</span>
          </div>

          <!-- 4个节点 -->
          <div
            v-for="(node, idx) in waybill.nodes"
            :key="idx"
            class="progress-step"
          >
            <!-- 节点圆点 -->
            <div class="progress-node" :class="getNodeStatus(waybill, idx)">
              <span class="node-check">
                <IconifyIcon icon="lucide:check" class="check-icon" />
              </span>
            </div>

            <!-- 节点内容 -->
            <div class="progress-content">
              <!-- <span v-if="idx !== 0" class="progress-label">{{ node.label }}</span> -->
              <span v-if="node.port" class="progress-port">{{
                node.port
              }}</span>
              <div class="progress-times">
                <span
                  v-for="(time, tIdx) in node.times"
                  :key="tIdx"
                  class="progress-time"
                >
                  <div>
                    <span class="progress-time-label">{{ time.label }}:</span>
                    {{ time.value }}
                  </div>
                </span>
              </div>
            </div>

            <!-- 箭头连线 -->
            <div
              v-if="idx < waybill.nodes.length - 1"
              class="progress-line-segment"
            >
              <div class="progress-line-bg"></div>
              <div
                class="progress-line-active"
                :class="getSegmentStatus(waybill, idx)"
              >
                <!-- 箭头（在激活线段内，随线段长度移动） -->
                <div
                  class="progress-arrow"
                  :class="getSegmentStatus(waybill, idx)"
                >
                  <svg viewBox="0 0 14 8" fill="none">
                    <path
                      d="M0 0L14 4L0 8Z"
                      class="arrow-path"
                      :class="getSegmentStatus(waybill, idx)"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：收货人名称 -->
          <div class="progress-recipient-info">
            <span class="recipient-name">{{ waybill.recipientName }}</span>
          </div>
        </div>
      </Card>

      <Card :bordered="false" class="waybill-card">
        <span class="waybill-status-label">{{ ft_waybill.statusLabel }}</span>

        <!-- 横向进度条 - 箭头连线 -->
        <div class="shipping-progress">
          <!-- 左侧：公司名称 -->
          <div class="progress-company-info">
            <span class="company-name">{{ ft_waybill.companyName }}</span>
          </div>

          <!-- 4个节点 -->
          <div
            v-for="(node, idx) in ft_waybill.nodes"
            :key="idx"
            class="progress-step"
          >
            <!-- 节点圆点 -->
            <div class="progress-node" :class="getNodeStatus(ft_waybill, idx)">
              <span class="node-check">
                <IconifyIcon icon="lucide:check" class="check-icon" />
              </span>
            </div>

            <!-- 节点内容 -->
            <div class="progress-content">
              <!-- <span v-if="idx !== 0" class="progress-label">{{ node.label }}</span> -->
              <span v-if="node.port" class="progress-port">{{
                node.port
              }}</span>
              <div class="progress-times">
                <span
                  v-for="(time, tIdx) in node.times"
                  :key="tIdx"
                  class="progress-time"
                >
                  <div>
                    <span class="progress-time-label">{{ time.label }}:</span>
                    {{ time.value }}
                  </div>
                </span>
              </div>
            </div>

            <!-- 箭头连线 -->
            <div
              v-if="idx < ft_waybill.nodes.length - 1"
              class="progress-line-segment"
            >
              <div class="progress-line-bg"></div>
              <div
                class="progress-line-active"
                :class="getSegmentStatus(ft_waybill, idx)"
              >
                <!-- 箭头（在激活线段内，随线段长度移动） -->
                <div
                  class="progress-arrow"
                  :class="getSegmentStatus(ft_waybill, idx)"
                >
                  <svg viewBox="0 0 14 8" fill="none">
                    <path
                      d="M0 0L14 4L0 8Z"
                      class="arrow-path"
                      :class="getSegmentStatus(ft_waybill, idx)"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧：收货人名称 -->
          <div class="progress-recipient-info">
            <span class="recipient-name">{{ ft_waybill.recipientName }}</span>
          </div>
        </div>
      </Card>
    </div>

    <!-- 详情弹窗 -->
    <Modal
      v-model:open="detailVisible"
      :title="
        selectedWaybill
          ? `${selectedWaybill.statusLabel} - 运单详情`
          : '运单详情'
      "
      width="700px"
      :footer="null"
    >
      <div v-if="selectedWaybill && editingWaybill" class="waybill-detail">
        <div class="detail-section">
          <h3>基本信息</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">公司名称</span>
              <a-input
                v-if="isEditing"
                v-model:value="editForm.companyName"
                placeholder="请输入公司名称"
              />
              <span v-else class="detail-value">{{
                editingWaybill?.companyName
              }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">起运港</span>
              <a-input
                v-if="isEditing"
                v-model:value="editForm.originPort"
                placeholder="请输入起运港"
              />
              <span v-else class="detail-value">{{
                editingWaybill?.originPort
              }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">目的港</span>
              <a-input
                v-if="isEditing"
                v-model:value="editForm.destPort"
                placeholder="请输入目的港"
              />
              <span v-else class="detail-value">{{
                editingWaybill?.destPort
              }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">收货人</span>
              <a-input
                v-if="isEditing"
                v-model:value="editForm.recipientName"
                placeholder="请输入收货人"
              />
              <span v-else class="detail-value">{{
                editingWaybill?.recipientName
              }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3>时间节点</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">货好时间</span>
              <a-input
                v-if="isEditing"
                v-model:value="editForm.goodsReadyDate"
                type="date"
                placeholder="请选择日期"
              />
              <span v-else class="detail-value">{{
                editingWaybill?.goodsReadyDate
              }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">提空日期</span>
              <a-input
                v-if="isEditing"
                v-model:value="editForm.emptyPickupDate"
                type="date"
                placeholder="请选择日期"
              />
              <span v-else class="detail-value">{{
                editingWaybill?.emptyPickupDate
              }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">还重日期</span>
              <a-input
                v-if="isEditing"
                v-model:value="editForm.returnHeavyDate"
                type="date"
                placeholder="请选择日期"
              />
              <span v-else class="detail-value">{{
                editingWaybill?.returnHeavyDate || '-'
              }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">ETD</span>
              <a-input
                v-if="isEditing"
                v-model:value="editForm.etd"
                type="date"
                placeholder="请选择日期"
              />
              <span v-else class="detail-value">{{
                editingWaybill?.etd || '-'
              }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">ETA</span>
              <a-input
                v-if="isEditing"
                v-model:value="editForm.eta"
                type="date"
                placeholder="请选择日期"
              />
              <span v-else class="detail-value">{{
                editingWaybill?.eta || '-'
              }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">ATA</span>
              <a-input
                v-if="isEditing"
                v-model:value="editForm.ata"
                type="date"
                placeholder="请选择日期"
              />
              <span v-else class="detail-value">{{
                editingWaybill?.ata || '-'
              }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">派送日期</span>
              <a-input
                v-if="isEditing"
                v-model:value="editForm.deliveryDate"
                type="date"
                placeholder="请选择日期"
              />
              <span v-else class="detail-value">{{
                editingWaybill?.deliveryDate || '-'
              }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">还空日期</span>
              <a-input
                v-if="isEditing"
                v-model:value="editForm.returnEmptyDate"
                type="date"
                placeholder="请选择日期"
              />
              <span v-else class="detail-value">{{
                editingWaybill?.returnEmptyDate || '-'
              }}</span>
            </div>
          </div>
        </div>

        <div class="detail-actions">
          <Button @click="cancelEdit">取消</Button>
          <Button type="primary" @click="saveEdit">保存</Button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.waybill-detail {
  padding: 8px 0;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h3 {
  padding-bottom: 8px;
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: #8c8c8c;
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.detail-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  margin-top: 24px;
  border-top: 1px solid #f0f0f0;
}

.check-icon {
  font-size: 16px;
  color: #fff;
}

.container-input-group {
  display: flex;
  align-items: center;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}
</style>
