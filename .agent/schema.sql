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

-- 5. 终极打卡、仪表盘与面试规范
-- daily_checkins: 全局终极打卡日志。每日任务全部闭环后，由首页底部固定大打卡按钮主动触发打卡随笔弹窗。
--   checkin_date: 工作区内的打卡日期。
--   streak_days: 当前连续坚持天数。
--   memo: 随笔文字，可为空。
--   image_url: Supabase Storage 图片链接，终版限制每日最多 1 张。
--   说明：当前权威需求为 daily_checkins；可执行迁移文件已在 P6 从旧 artifacts 语义同步调整。
-- interview_sessions / interview_checklist_items:
--   试讲自评目录与锁死检查单；complete_interview_session() 要求全绿才能闭环。

-- 6. 复习书架与可编辑思维导图（迁移 supabase/migrations/0002_books.sql）
-- books: 用户在「知识树」Tab 维护的复习书目（如《教育心理学》）。
--   title 书名，author 作者（选填），cover_color 封面色，order_index 书架排序。
-- book_nodes: 每本书对应的思维导图节点，使用 parent_id 邻接表无限嵌套。
--   parent_id 为空者即根节点（一本书一个根）；title 主标题，subtitle 副标题（选填），order_index 同级排序。
--   说明：知识树页已从旧的七层 nodes 展示重构为「书架 + 思维导图」；nodes/template_nodes 仍服务于首页调度引擎。

-- 7. RLS
-- catalog_options / official templates 对登录用户公开读取。
-- workspaces/nodes/study_logs/node_reviews/daily_checkins/interview_*/books/book_nodes 全部按 user_id 或 owner 限制。
-- 客户端仅允许使用 anon key，严禁 service_role 进入应用代码。
