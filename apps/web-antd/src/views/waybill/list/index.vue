<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { Card, Button, Modal, Input as AInput, message } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { queryContainerTrack, type ContainerTrackResult } from '#/api/freetower';
import './styles.css';

interface WaybillNode {
  label: string;
  port?: string;
  times: { label: string; value: string }[];
}

interface Waybill {
  id: string;
  companyName: string;
  recipientName: string;
  originPort: string;
  destPort: string;
  nodes: WaybillNode[];
  currentStatus: number;
  statusLabel: string;
  goodsReadyDate: string;
  emptyPickupDate: string;
  etd: string;
  ata: string;
  eta: string;
  deliveryDate: string;
  returnEmptyDate: string;
  mblNo?: string;
  containerNo?: string;
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
    mbl_no: 'MBL号',
    container_no: '集装箱号',
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
    mbl_no: 'MBL号',
    container_no: '集装箱号',
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
    mbl_no: 'MBL号',
    container_no: '集装箱号',
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
    mbl_no: 'MBL号',
    container_no: '集装箱号',
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
    mbl_no: 'MBL号',
    container_no: '集装箱号',
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
    mbl_no: 'MBL号',
    container_no: '集装箱号',
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
  },
]);

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
  Object.keys(editForm).forEach(key => delete editForm[key as keyof Waybill]);
}

function saveEdit() {
  if (selectedWaybill.value && editingWaybill.value) {
    const index = waybills.value.findIndex(w => w.id === selectedWaybill.value?.id);
    if (index !== -1) {
      // 从 editForm 和 editingWaybill 合并创建新对象
      const updatedWaybill = { ...editingWaybill.value, ...editForm } as Waybill;
      
      // 同步更新 nodes 数组中的数据
      if (updatedWaybill.nodes) {
        // 节点0: 公司名称的货好时间和提空日期
        if (updatedWaybill.nodes[0] && updatedWaybill.nodes[0].times) {
          // 查找并更新货好时间
          const goodsReadyTime = updatedWaybill.nodes[0].times.find(t => t.label === '货好时间');
          if (goodsReadyTime) {
            goodsReadyTime.value = updatedWaybill.goodsReadyDate || goodsReadyTime.value;
          }
          // 查找并更新提空日期
          const pickupTime = updatedWaybill.nodes[0].times.find(t => t.label === '提空日期');
          if (pickupTime) {
            pickupTime.value = updatedWaybill.emptyPickupDate || pickupTime.value;
          }
        }
        // 节点1: 起运港和ETD/ATD
        if (updatedWaybill.nodes[1]) {
          updatedWaybill.nodes[1].port = updatedWaybill.originPort;
          if (updatedWaybill.nodes[1].times[0]) {
            updatedWaybill.nodes[1].times[0].value = updatedWaybill.etd || updatedWaybill.nodes[1].times[0].value;
          }
        }
        // 节点2: 目的港和ETA/ATA
        if (updatedWaybill.nodes[2]) {
          updatedWaybill.nodes[2].port = updatedWaybill.destPort;
          if (updatedWaybill.nodes[2].times[0]) {
            updatedWaybill.nodes[2].times[0].value = updatedWaybill.ata || updatedWaybill.eta || updatedWaybill.nodes[2].times[0].value;
          }
          // 查找并更新节点2中的提空日期（目的港提空）
          const destPickupTime = updatedWaybill.nodes[2].times.find(t => t.label === '提空日期');
          if (destPickupTime) {
            destPickupTime.value = updatedWaybill.returnEmptyDate || destPickupTime.value;
          }
        }
        // 节点3: 收货人的派送日期和还空日期
        if (updatedWaybill.nodes[3] && updatedWaybill.nodes[3].times) {
          // 查找并更新派送日期
          const deliveryTime = updatedWaybill.nodes[3].times.find(t => t.label === '派送日期');
          if (deliveryTime) {
            deliveryTime.value = updatedWaybill.deliveryDate || deliveryTime.value;
          }
          // 查找并更新还空日期
          const returnTime = updatedWaybill.nodes[3].times.find(t => t.label === '还空日期');
          if (returnTime) {
            returnTime.value = updatedWaybill.returnEmptyDate || returnTime.value;
          }
        }
      }
      
      // 创建新数组触发响应式更新
      const newWaybills = waybills.value.map((item, i) => 
        i === index ? updatedWaybill : item
      );
      waybills.value = newWaybills;
    }
    isEditing.value = false;
    detailVisible.value = false;
    // 清空 editForm
    Object.keys(editForm).forEach(key => delete editForm[key as keyof Waybill]);
  }
}

async function searchContainer() {
  if (!editForm.containerNo) {
    message.warning('请先输入集装箱号');
    return;
  }

  try {
    message.loading({ content: '正在查询集装箱信息...', key: 'container-search' });
    
    const result = await queryContainerTrack(editForm.containerNo);
    
    if (result.statusCode === 200 || result.statusCode === 0) {
      message.success({ content: '查询成功', key: 'container-search' });
      console.log('集装箱跟踪结果:', result);
      
      // 可以在这里显示查询结果
      if (result.data?.result) {
        message.info(`找到 ${Array.isArray(result.data.result) ? result.data.result.length : 1} 条跟踪记录`);
      }
    } else {
      message.error({ content: result.message || '查询失败', key: 'container-search' });
    }
  } catch (error) {
    console.error('集装箱查询失败:', error);
    message.error({ content: '查询失败，请检查网络连接或联系管理员', key: 'container-search' });
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

function handleNewWaybill() {
  // TODO: navigate to create waybill page
}
</script>

<template>
  <div class="waybill-page">
    <div class="waybill-page-header">
      <h1 class="waybill-page-title">运单列表</h1>
      <Button type="primary" @click="handleNewWaybill">
        <template #icon>
          <IconifyIcon icon="lucide:plus" />
        </template>
        新建运单
      </Button>
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
            <div
              class="progress-node"
              :class="getNodeStatus(waybill, idx)"
            >
              <span class="node-check">
                <IconifyIcon icon="lucide:check" class="check-icon" />
              </span>
            </div>

            <!-- 节点内容 -->
            <div class="progress-content">
              <!-- <span v-if="idx !== 0" class="progress-label">{{ node.label }}</span> -->
              <span v-if="node.port" class="progress-port">{{ node.port }}</span>
              <div class="progress-times">
                <span
                  v-for="(time, tIdx) in node.times"
                  :key="tIdx"
                  class="progress-time"
                >
                  <span class="progress-time-label">{{ time.label }}:</span>
                  {{ time.value }}
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
    </div>

    <!-- 详情弹窗 -->
    <Modal
      v-model:open="detailVisible"
      :title="selectedWaybill ? `${selectedWaybill.statusLabel} - 运单详情` : '运单详情'"
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
              <span v-else class="detail-value">{{ editingWaybill?.companyName }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">起运港</span>
              <a-input
                v-if="isEditing"
                v-model:value="editForm.originPort"
                placeholder="请输入起运港"
              />
              <span v-else class="detail-value">{{ editingWaybill?.originPort }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">目的港</span>
              <a-input
                v-if="isEditing"
                v-model:value="editForm.destPort"
                placeholder="请输入目的港"
              />
              <span v-else class="detail-value">{{ editingWaybill?.destPort }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">收货人</span>
              <a-input
                v-if="isEditing"
                v-model:value="editForm.recipientName"
                placeholder="请输入收货人"
              />
              <span v-else class="detail-value">{{ editingWaybill?.recipientName }}</span>
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
              <span v-else class="detail-value">{{ editingWaybill?.goodsReadyDate }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">提空日期</span>
              <a-input
                v-if="isEditing"
                v-model:value="editForm.emptyPickupDate"
                type="date"
                placeholder="请选择日期"
              />
              <span v-else class="detail-value">{{ editingWaybill?.emptyPickupDate }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">ETD</span>
              <a-input
                v-if="isEditing"
                v-model:value="editForm.etd"
                type="date"
                placeholder="请选择日期"
              />
              <span v-else class="detail-value">{{ editingWaybill?.etd || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">ETA</span>
              <a-input
                v-if="isEditing"
                v-model:value="editForm.eta"
                type="date"
                placeholder="请选择日期"
              />
              <span v-else class="detail-value">{{ editingWaybill?.eta || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">ATA</span>
              <a-input
                v-if="isEditing"
                v-model:value="editForm.ata"
                type="date"
                placeholder="请选择日期"
              />
              <span v-else class="detail-value">{{ editingWaybill?.ata || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">派送日期</span>
              <a-input
                v-if="isEditing"
                v-model:value="editForm.deliveryDate"
                type="date"
                placeholder="请选择日期"
              />
              <span v-else class="detail-value">{{ editingWaybill?.deliveryDate || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">还空日期</span>
              <a-input
                v-if="isEditing"
                v-model:value="editForm.returnEmptyDate"
                type="date"
                placeholder="请选择日期"
              />
              <span v-else class="detail-value">{{ editingWaybill?.returnEmptyDate || '-' }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3>运输信息</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">MBL号</span>
              <a-input
                v-if="isEditing"
                v-model:value="editForm.mblNo"
                placeholder="请输入MBL号"
              />
              <span v-else class="detail-value">{{ editingWaybill?.mblNo || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">集装箱号</span>
              <div v-if="isEditing" class="container-input-group">
                <a-input
                  v-model:value="editForm.containerNo"
                  placeholder="请输入集装箱号"
                  style="flex: 1"
                />
              </div>
              <span v-else class="detail-value">{{ editingWaybill?.containerNo || '-' }}</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">点击查询飞驼数据</span>
              <Button type="primary" @click="searchContainer">
                  <template #icon>
                    <IconifyIcon icon="lucide:search" />
                  </template>
                  查询
                </Button>
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
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 8px;
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
  color: #333;
  font-weight: 500;
}

.detail-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
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
</style>
