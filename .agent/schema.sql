-- 深教考通 Supabase schema 设计稿
-- 权威可执行迁移文件：supabase/migrations/0001_init.sql
-- 种子数据：supabase/seed.sql
--
-- 为避免两份可执行 SQL 漂移，本文件记录结构摘要与关键约束。

-- 1. 公共目录与工作区
-- catalog_options: 地区 -> 科目 -> 考纲类别级联选项。
-- workspaces: 用户多目标隔离空间，user_id = auth.uid() owner 隔离。

-- 2. 官方模板
-- templates: 官方公共模板元信息。
-- template_nodes: 官方 7 层技能树模板，使用 parent_id 邻接表。
-- clone_template(template_id, workspace_id): 将模板递归克隆为用户私有 nodes。

-- 3. 七层知识树
-- nodes:
--   level: 1..7
--   parent_id: 邻接表自引用
--   is_leaf: 仅叶子进入调度池
--   status: locked | available | in_progress | done | archived
--   order_index: 同一父节点下的串行推进顺序
--   schedule_mode: serial | parallel
--   frequency_weight: 低频考点回收策略依据
--   trap_memo: 避坑便签，复测时提醒

-- 4. 执行记录与复测
-- study_logs: 高保真执行日志，payload 按 action_type 保存客观题/主观背诵/综合泛读表单数据。
-- node_reviews: 艾宾浩斯复测计划，间隔 1/2/4/7/15/30 天，过期任务提升为 P0。
-- settle_node(node_id, action_type, payload, duration, score, mastery, trap_memo):
--   原子写 study_logs -> 标记叶子 done -> 更新 node_reviews -> 解锁同父节点下满足串行条件的下一个节点。

-- 5. 仪表盘与面试规范
-- artifacts: 每日全闭环后的战果照片 Storage path。
-- interview_sessions / interview_checklist_items:
--   试讲自评目录与锁死检查单；complete_interview_session() 要求全绿才能闭环。

-- 6. RLS
-- catalog_options / official templates 对登录用户公开读取。
-- workspaces/nodes/study_logs/node_reviews/artifacts/interview_* 全部按 user_id 或 workspace owner 限制。
-- 客户端仅允许使用 anon key，严禁 service_role 进入应用代码。
