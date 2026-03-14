<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">スタッフ管理</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">{{ activeCount }}名のアクティブスタッフ</p>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" rounded="lg" @click="addDialog = true">
        スタッフを追加
      </v-btn>
    </div>

    <!-- Filters -->
    <v-card rounded="xl" elevation="0" border class="mb-4">
      <v-card-text class="pa-4">
        <v-row dense>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="名前で検索"
              clearable
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-select
              v-model="deptFilter"
              :items="['全部署', 'キッチン', 'ホール', 'レジ']"
              label="部署"
            />
          </v-col>
          <v-col cols="12" sm="4">
            <v-select
              v-model="typeFilter"
              :items="employmentTypeOptions"
              item-title="label"
              item-value="value"
              label="雇用形態"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Table -->
    <v-card rounded="xl" elevation="0" border>
      <v-data-table
        :headers="headers"
        :items="filteredEmployees"
        density="compact"
        hover
        @click:row="onRowClick"
        style="cursor: pointer"
      >
        <template #item.name="{ item }">
          <div class="d-flex align-center ga-2">
            <v-avatar :color="deptColor(item.department)" size="28">
              <span class="text-white text-caption">{{ item.name.charAt(0) }}</span>
            </v-avatar>
            <div>
              <div class="text-body-2 font-weight-medium">{{ item.name }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.nameKana }}</div>
            </div>
          </div>
        </template>
        <template #item.employmentType="{ item }">
          <span class="text-caption">{{ employmentTypeJa(item.employmentType) }}</span>
        </template>
        <template #item.hourlyWage="{ item }">
          <span class="text-body-2">¥{{ item.hourlyWage.toLocaleString() }}</span>
        </template>
        <template #item.skills="{ item }">
          <div class="d-flex align-center ga-1 flex-wrap py-1">
            <v-chip
              v-for="skill in item.skills.slice(0, 2)"
              :key="skill"
              size="x-small"
              variant="tonal"
              color="primary"
            >{{ skill }}</v-chip>
            <v-chip v-if="item.skills.length > 2" size="x-small" variant="tonal" color="default">
              +{{ item.skills.length - 2 }}
            </v-chip>
          </div>
        </template>
        <template #item.status="{ item }">
          <v-chip :color="item.status === 'ACTIVE' ? 'success' : 'default'" size="x-small" variant="flat">
            {{ item.status === 'ACTIVE' ? '在籍中' : '退職' }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn
            :to="`/employees/${item.id}`"
            icon
            size="x-small"
            variant="text"
            @click.stop
          >
            <v-icon size="16">mdi-eye-outline</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Add dialog -->
    <v-dialog v-model="addDialog" max-width="480">
      <v-card rounded="xl">
        <v-card-title class="pa-4 text-subtitle-1 font-weight-bold">スタッフを追加</v-card-title>
        <v-divider />
        <v-card-text class="pa-4">
          <div class="d-flex flex-column ga-3">
            <v-text-field v-model="newEmp.name" label="氏名" />
            <v-text-field v-model="newEmp.nameKana" label="氏名（カナ）" />
            <v-select v-model="newEmp.department" :items="['キッチン', 'ホール', 'レジ']" label="部署" />
            <v-select v-model="newEmp.position" :items="['クルー', 'リーダー', 'マネージャー']" label="ポジション" />
            <v-select
              v-model="newEmp.employmentType"
              :items="employmentTypeOptions"
              item-title="label"
              item-value="value"
              label="雇用形態"
            />
            <v-text-field v-model="newEmp.hourlyWage" type="number" label="時給（円）" prefix="¥" />
            <v-combobox
              v-model="newEmp.skills"
              :items="skillOptions"
              label="スキル"
              multiple
              chips
              closable-chips
              hint="選択または入力してカスタムスキルを追加できます"
              persistent-hint
            />
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn variant="text" @click="addDialog = false">キャンセル</v-btn>
          <v-btn color="primary" variant="flat" @click="addDialog = false">追加</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { useMockData } from '~/composables/useMockData'
import type { EmploymentType } from '~/types'

const { employees } = useMockData()
const router = useRouter()

const search = ref('')
const deptFilter = ref('全部署')
const typeFilter = ref('ALL')
const addDialog = ref(false)
const newEmp = reactive({ name: '', nameKana: '', department: 'ホール', position: 'クルー', employmentType: 'PART_TIME', hourlyWage: 1050, skills: [] as string[] })

const skillOptions = ['調理', '接客', 'ドリンク', 'レジ操作', '発注管理', '売上管理', '開閉店', 'トレーナー', '食品衛生管理者']

const employmentTypeOptions = [
  { label: '全種別', value: 'ALL' },
  { label: '正社員', value: 'FULL_TIME' },
  { label: 'アルバイト', value: 'PART_TIME' },
  { label: 'フレックス', value: 'FLEX' },
  { label: '裁量労働', value: 'DISCRETIONARY' },
]

const headers = [
  { title: '従業員名', key: 'name', sortable: true },
  { title: '部署', key: 'department', sortable: true },
  { title: 'ポジション', key: 'position', sortable: true },
  { title: '雇用形態', key: 'employmentType', sortable: true },
  { title: '時給', key: 'hourlyWage', sortable: true },
  { title: 'スキル', key: 'skills', sortable: false },
  { title: 'ステータス', key: 'status', sortable: true },
  { title: '', key: 'actions', sortable: false, width: '48px' },
]

const activeCount = computed(() => employees.filter(e => e.status === 'ACTIVE').length)

const filteredEmployees = computed(() =>
  employees.filter(e => {
    if (search.value && !e.name.includes(search.value) && !e.nameKana.includes(search.value)) return false
    if (deptFilter.value !== '全部署' && e.department !== deptFilter.value) return false
    if (typeFilter.value !== 'ALL' && e.employmentType !== typeFilter.value) return false
    return true
  })
)

function deptColor(dept: string) {
  const map: Record<string, string> = { 'キッチン': '#3587dc', 'ホール': '#4bd08b', 'レジ': '#f8c076' }
  return map[dept] ?? '#80848e'
}

function employmentTypeJa(type: EmploymentType): string {
  const map: Record<EmploymentType, string> = {
    FULL_TIME: '正社員', PART_TIME: 'アルバイト', FLEX: 'フレックス', DISCRETIONARY: '裁量労働',
  }
  return map[type] ?? type
}

function onRowClick(_event: Event, { item }: { item: { id: string } }) {
  router.push(`/employees/${item.id}`)
}
</script>
