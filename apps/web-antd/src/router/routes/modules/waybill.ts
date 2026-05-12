import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:package',
      title: '运单管理',
    },
    name: 'Waybill',
    path: '/waybill',
    children: [
      {
        name: 'WaybillList',
        path: '/list',
        component: () => import('#/views/waybill/list/index.vue'),
        meta: {
          title: '运单列表',
        },
      },
      {
        name: 'WaybillDetail',
        path: '/detail/:id?',
        component: () => import('#/views/waybill/detail/index.vue'),
        meta: {
          title: '运单详情',
          hideInMenu: true,
        },
      },
    ],
  },
];

export default routes;