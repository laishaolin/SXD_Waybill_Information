<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Card, Button, Descriptions } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';

const router = useRouter();

const waybillData = computed(() => {
  return {
    id: 'WB20260001',
    companyName: '广州市尚雷仕卫浴有限公司',
    originPort: 'YANTIAN',
    destPort: 'ROTTERDAM',
    recipientName: 'SUPERIOR WELLNESS LTD',
    currentStatus: 3,
    statusLabel: '前往目的港途中',
    goodsReadyDate: '2026-05-01',
    emptyPickupDate: '2026-05-05',
    etd: '2026-05-11',
    eta: '2026-06-20',
    ata: '',
    deliveryDate: '',
    returnEmptyDate: '',
  };
});

function goBack() {
  router.push('/waybill/list');
}
</script>

<template>
  <div class="waybill-detail-page">
    <div class="detail-header">
      <Button @click="goBack">
        <template #icon>
          <IconifyIcon icon="lucide:arrow-left" />
        </template>
        返回列表
      </Button>
      <h1 class="detail-title">运单详情 - {{ waybillData.id }}</h1>
    </div>

    <Card title="基本信息" :bordered="false">
      <Descriptions bordered :column="3">
        <Descriptions.Item label="公司名称">
          {{ waybillData.companyName }}
        </Descriptions.Item>
        <Descriptions.Item label="起运港">
          {{ waybillData.originPort }}
        </Descriptions.Item>
        <Descriptions.Item label="目的港">
          {{ waybillData.destPort }}
        </Descriptions.Item>
        <Descriptions.Item label="收货人">
          {{ waybillData.recipientName }}
        </Descriptions.Item>
        <Descriptions.Item label="当前状态">
          <span class="status-badge status-in-transit">{{ waybillData.statusLabel }}</span>
        </Descriptions.Item>
      </Descriptions>
    </Card>

    <Card title="时间节点" :bordered="false" style="margin-top: 16px">
      <Descriptions bordered :column="3">
        <Descriptions.Item label="货好时间">
          {{ waybillData.goodsReadyDate }}
        </Descriptions.Item>
        <Descriptions.Item label="提空日期">
          {{ waybillData.emptyPickupDate }}
        </Descriptions.Item>
        <Descriptions.Item label="ETD">
          {{ waybillData.etd || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="ETA">
          {{ waybillData.eta || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="ATA">
          {{ waybillData.ata || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="派送日期">
          {{ waybillData.deliveryDate || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="还空日期">
          {{ waybillData.returnEmptyDate || '-' }}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  </div>
</template>

<style scoped>
.waybill-detail-page {
  padding: 24px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.detail-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-in-transit {
  background: #e6f4ff;
  color: #1677ff;
}
</style>
