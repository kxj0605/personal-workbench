import React from 'react';
import { Check, Copy, ImagePlus, Layers3, Pencil, Sparkles, X } from 'lucide-react';
import './ImageGenerationPanel.css';

const EDIT_METHODS = [
  {
    id: 'add-remove',
    subcategory: 'local-content',
    title: '人物、物品 【增加/删除】 局部元素',
    description: '适用于画面中单个人物或单个物品的增加、删除；删除人物时完整移除，并补齐被遮挡的背景。',
    prompt: '只修改画面【具体位置，例如墙角 / 桌面左侧】的【人物或物品，例如蹲着的人 / 蓝色茶杯】，执行【增加 / 删除】操作。【增加时，描述主体的外观和状态，例如添加一位穿灰色外套的人 / 放置一个蓝色茶杯；删除时，说明要移除的主体，例如移除墙角蹲着的人 / 移除破损的蓝色茶杯】。\n\n一次只处理一个主体。删除时完整移除指定主体；如果主体遮挡了背景，请根据周围环境自然补齐被遮挡区域，不留残影。其他人物的身份、动作和位置，以及其他物品、场景布局、光线、镜头角度、画幅和清晰度保持原图完全不变。\n\n不要替换主体，不要误删或新增其他人物、物品、文字或水印。',
  },
  {
    id: 'replace',
    subcategory: 'local-content',
    title: '人物、物品 【替换】 指定主体',
    description: '适合更换画面中的人物、服饰主体、道具或食物，并锁住已有构图。',
    prompt: '只将画面【位置】的【原人物 / 原物品】替换为【新人物 / 新物品】。\n\n新主体保持【外貌 / 材质 / 颜色 / 年龄 / 状态】。\n\n其他所有内容保持原图完全不变，包括其他人物、动作、位置关系、背景、光线、镜头、画幅和清晰度。',
  },
  {
    id: 'move-subject',
    subcategory: 'local-content',
    title: '人物、物品 【移动】 指定主体',
    description: '将一个完整人物或独立物体从原位置移动到目标位置，不改变主体本身。',
    prompt: '只移动画面【原位置】的【主体名称，例如门边的乞丐 / 桌上的蓝色茶杯】到【目标位置】。\n\n主体移动后保持完整，身份或物品特征、外观、大小比例、朝向、姿势或摆放方式完全不变；与地面、桌面或其他物体的接触和透视关系自然准确。\n\n主体移开后，根据周围环境自然补齐原位置被遮挡的背景；目标位置的遮挡关系自然。\n\n其他人物、物品、场景布局、光线、镜头、构图、画幅和清晰度保持原图完全不变。不要新增、删除、替换、复制或变形任何主体。',
  },
  {
    id: 'position',
    subcategory: 'person-action',
    title: '只调整人物的动作与姿势',
    description: '用于修正站坐、身体姿势、朝向和手部动作，不移动人物所在位置。',
    prompt: '只修改【人物名称】的动作与姿势：让他/她【明确动作或姿势】，朝向【明确方向】；双手【明确状态】。\n\n保持人物所在位置、身份、外观和服装不变。其他人物、道具、场景布局、镜头角度、光线、画幅和画面内容保持原图完全不变。\n\n不要改变任何其他人的姿势或位置。',
  },
  {
    id: 'composition',
    subcategory: 'shot-format',
    title: '调整景别与画幅',
    description: '用于改变取景远近、画面裁切范围或横竖画幅。',
    prompt: '保持画面中的人物、服装、道具、场景和故事时刻完全一致，只修改景别与画幅：\n\n改为【景别，例如中景 / 近景 / 全景】，画幅为【16:9 / 9:16 / 1:1】，保留画面中应出现的主体和环境范围。\n\n不要新增、删除或替换任何人物和物品；不要改变人物动作、位置、场景布局、光线和画风。',
  },
  {
    id: 'details',
    subcategory: 'person-appearance',
    title: '保留人物身份，只改外观细节',
    description: '适合调整衣服颜色、材质、破损程度、发型和局部表情。',
    prompt: '只修改【人物名称】的【服装 / 发型 / 表情 / 局部细节】：改为【具体描述，例如深灰色磨破起毛的旧外套】。\n\n人物脸部身份、体型、姿势、位置、其他人物、道具、背景、光线、镜头和画幅保持原图完全不变。',
  },
  {
    id: 'background',
    subcategory: 'scene-replacement',
    title: '替换整体背景环境',
    description: '适合更换或调整场景背景，同时保留人物、产品主体和原有构图。',
    prompt: '只修改画面背景环境，将【原背景】替换为【新环境】。\n\n环境包含【时间 / 天气 / 季节 / 场景细节】。\n\n保持人物和主体的身份、外观、动作、位置以及原图构图不变。\n\n不要新增无关人物、道具、文字或水印。',
  },
  {
    id: 'style',
    subcategory: 'art-medium',
    title: '转换画风与媒介',
    description: '用于统一写实、电影、插画、动漫或胶片等画风与媒介。',
    prompt: '保持原图的人物身份、动作、道具、场景布局和故事时刻完全不变，只转换画风与媒介：统一为【目标画风或媒介，例如写实电影感 / 水彩插画 / 复古胶片】。\n\n不要改变色彩基调、光线方向、画幅、构图或清晰度；不要新增或删除人物、物品、文字、标志和水印。',
  },
  {
    id: 'scene-layout',
    subcategory: 'scene-layout',
    title: '调整场景布置',
    description: '调整墙面、门窗、桌椅、陈设、树木等与场景绑定的布局或细节。',
    prompt: '只修改画面中的场景布置：将【具体环境区域】的【固定设施或景物】调整为【目标布置或状态】。\n\n保留人物和主要主体的身份、外观、动作、位置，以及整体地点、镜头、光线、画幅不变。不要新增无关人物、道具、文字或水印。',
  },
  {
    id: 'environment-condition',
    subcategory: 'environment-condition',
    title: '调整环境条件',
    description: '修改昼夜、季节、天气或雾、风等自然环境条件。',
    prompt: '保持地点、人物、主体、构图和故事时刻不变，只将环境条件调整为【时间 / 季节 / 天气 / 自然介质，例如傍晚小雨 / 冬季薄雪 / 清晨薄雾】。\n\n环境变化应自然作用于背景和地面，不要新增人物、改变人物动作，或把画面改成不同地点。',
  },
  {
    id: 'scene-state',
    subcategory: 'scene-state',
    title: '调整场景状态',
    description: '处理场景整体的整洁、破旧、干湿、使用痕迹或闲置状态。',
    prompt: '只调整画面中【具体场景区域】的环境状态，使其呈现【整洁 / 凌乱 / 崭新 / 破旧 / 潮湿 / 有使用痕迹】的状态。\n\n保持地点、人物、主体、场景布局、天气、光线、镜头和画幅不变；不要修复或替换单个独立道具。',
  },
  {
    id: 'camera-angle',
    subcategory: 'camera-angle',
    title: '调整机位与视角',
    description: '改变平视、俯拍、仰拍、正面、侧面或背面等相机观察角度。',
    prompt: '保持人物、道具、场景和故事时刻完全一致，只修改相机机位与视角：镜头从【机位高度和观察方向，例如平视正面 / 微俯侧面】拍摄。\n\n不要改变人物的动作、朝向、相互位置或场景布局；不要新增、删除或替换任何画面内容。',
  },
  {
    id: 'subject-composition',
    subcategory: 'subject-composition',
    title: '调整主体构图',
    description: '调整主体在画面内的位置、留白、均衡关系和前中后景组织。',
    prompt: '保持人物、道具和场景中的实际位置关系不变，只调整画面构图：让【主体】位于画面【位置】，保留【留白 / 对称或三分法 / 前中后景层次】。\n\n不要改变人物的动作、姿势、朝向或互动；不要新增、删除或替换任何内容。',
  },
  {
    id: 'focus-depth',
    subcategory: 'focus-depth',
    title: '调整焦点与景深',
    description: '明确清晰主体、前后景虚化和景深层级。',
    prompt: '保持画面内容、构图、机位和光线完全不变，只调整焦点与景深：让【焦点主体】清晰锐利，令【前景 / 背景】呈现【轻微 / 明显】自然虚化。\n\n不要修复单个物体的模糊，不要改变人物、道具、场景或画幅。',
  },
  {
    id: 'color-mood',
    subcategory: 'color-mood',
    title: '调整色彩与情绪',
    description: '修改冷暖、饱和度、主色调与整体情绪基调。',
    prompt: '保持人物、道具、场景、构图和光线方向完全不变，只调整全画面的色彩与情绪：采用【冷暖倾向 / 主色调 / 饱和度】并呈现【温暖 / 压抑 / 宁静 / 复古】的情绪。\n\n不要改成不同画风，不要改变昼夜、天气或画幅。',
  },
  {
    id: 'lighting-exposure',
    subcategory: 'lighting-exposure',
    title: '调整光影与曝光',
    description: '调整光线方向、软硬、明暗对比、阴影和曝光表现。',
    prompt: '保持人物、道具、场景、构图、时间和天气完全不变，只调整画面光影与曝光：使用【光线方向 / 软硬 / 明暗对比 / 曝光】效果。\n\n光影应符合原场景透视和遮挡关系；不要改变主色调、画风或画幅。',
  },
  {
    id: 'image-quality',
    subcategory: 'image-quality',
    title: '调整成像质感',
    description: '调整整体清晰度、颗粒、噪点、细腻度和画面纹理。',
    prompt: '保持人物、道具、场景、构图、色彩和光线完全不变，只调整全画面的成像质感：呈现【清晰细腻 / 轻微胶片颗粒 / 低噪点 / 自然纹理】效果。\n\n不要只修复某一个物体，不要改变画风、景深、画幅或任何画面内容。',
  },
  {
    id: 'local-blur-repair',
    subcategory: 'local-content',
    title: '物体 【修复】 模糊',
    description: '让指定物体恢复清晰可辨，不改变周围区域。',
    prompt: '只修复画面【具体位置】的【物体名称】，将其从【模糊 / 失焦 / 细节不清】调整为清晰、自然且符合原图透视的状态。\n\n保留该物体原有的【形状 / 颜色 / 材质 / 位置】。其他所有内容保持原图完全不变，包括人物、其他物体、背景、光线、构图、镜头和画幅。',
  },
  {
    id: 'local-damage-repair',
    subcategory: 'local-content',
    title: '物体 【修复】 破损、缺陷',
    description: '修补指定道具的裂痕、缺口或表面瑕疵。',
    prompt: '只修复画面【具体位置】的【物体名称】：将【破损或瑕疵描述】修补为【修复后的状态】，保留物体原有的造型、材质、颜色和使用痕迹。\n\n物体的位置、大小和朝向保持不变。其他所有内容保持原图完全不变，包括人物、其他物体、背景、光线、构图和画幅。',
  },
  {
    id: 'local-food-amount',
    subcategory: 'local-content',
    title: '食物 【调整】 剩余量',
    description: '只增减指定餐具中的食物，适合表现已吃或未吃状态。',
    prompt: '只调整画面【具体位置】的【食物名称】剩余量：将当前状态改为【几乎未动 / 吃掉一半 / 只剩少量 / 完全吃完】。\n\n保持餐具、食物种类、摆放位置和桌面状态一致。其他所有内容保持原图完全不变，包括人物、手部动作、其他物品、背景、光线和构图。',
  },
  {
    id: 'local-scale-proportion',
    subcategory: 'local-content',
    title: '人物、物品 【调整】 与环境的大小比例',
    description: '修正人物或物品相对周围环境显得过大或过小的问题。',
    prompt: '只调整画面中【主体名称及位置，例如墙角蹲着的人 / 桌上的花瓶】与周围环境的大小比例，使主体符合正常的空间尺度。\n\n以【参照物，例如墙面、门、桌椅、地砖】为尺度依据，将主体调整为【合理的大小或比例描述】。保持主体原有的【位置 / 姿势或摆放方式 / 朝向】不变，透视、接地或接触关系自然。\n\n其他所有内容保持原图完全不变，包括主体身份或物品特征、其他人物和物品、背景、构图、光线、镜头和画幅。',
  },
  {
    // Retained so any prompt text already saved under this id remains in localStorage after merging the visible card.
    id: 'local-remove-person',
    subcategory: 'local-content',
    title: '移除指定人物并补全背景',
    description: '删除画面中一个明确指定的人，并自然补齐其遮挡区域。',
    prompt: '只移除画面【具体位置】的【人物特征或称呼】，并根据周围环境自然补全人物原来遮挡的背景。\n\n保留其他人物的身份、动作和位置不变。其他所有内容保持原图完全不变，包括道具、场景布局、光线、镜头角度和画幅；不要留下残影或新增人物。',
  },
  {
    id: 'appearance-clothing',
    subcategory: 'person-appearance',
    title: '只更换人物服装',
    description: '更改指定人物的衣着，同时锁定身份、动作和发型。',
    prompt: '只修改【人物名称】的服装，将当前服装改为【服装款式、颜色和材质，例如深蓝色棉布外套】。\n\n保持该人物的脸部身份、发型、表情、体型、姿势、动作和位置完全不变。其他人物、道具、背景、光线、镜头、构图和画幅保持原图完全不变。',
  },
  {
    id: 'appearance-hairstyle',
    subcategory: 'person-appearance',
    title: '只调整人物发型',
    description: '修改发型或头发状态，不改变脸部身份与服饰。',
    prompt: '只修改【人物名称】的发型：将头发调整为【发型和长度，例如齐肩直发 / 整齐短发】，颜色为【发色】，状态为【整洁 / 微乱 / 被风吹起】。\n\n保持人物脸部身份、五官、表情、服装、姿势、动作和位置不变。其他人物、道具、背景、光线、镜头、构图和画幅保持原图完全不变。',
  },
  {
    id: 'appearance-expression',
    subcategory: 'person-appearance',
    title: '只改变人物表情',
    description: '调整面部情绪，不改变视线、头部朝向或身体动作。',
    prompt: '只改变【人物名称】的面部表情，使其呈现【具体情绪，例如克制的难过 / 放松的微笑 / 惊讶】；表情自然、程度为【轻微 / 明显】。\n\n保持人物身份、五官、视线方向、头部朝向、服装、身体姿势、动作和位置完全不变。其他人物及画面所有内容保持原图完全不变。',
  },
  {
    id: 'appearance-accessory',
    subcategory: 'person-appearance',
    title: '增减人物配饰',
    description: '只为指定人物添加或移除一件配饰。',
    prompt: '只调整【人物名称】的配饰：【增加 / 移除】位于【佩戴位置】的【配饰名称，例如一副细框眼镜】。\n\n配饰与人物外观自然贴合。保持人物身份、表情、发型、服装、动作和位置不变；其他人物、道具、背景、光线、构图和画幅保持原图完全不变。',
  },
  {
    id: 'action-sitting-standing',
    subcategory: 'person-action',
    title: '调整人物站坐姿势',
    description: '只将指定人物改为站立或坐下，保留所在位置与身份。',
    prompt: '只调整【人物名称】的姿势：让他/她从【当前姿势】改为【站立 / 坐在具体位置】，身体重心自然，双脚或坐姿与地面、座椅接触合理。\n\n保持人物身份、服装、表情和所在位置不变。其他人物、道具、场景布局、光线、镜头、构图和画幅保持原图完全不变。',
  },
  {
    id: 'action-gaze',
    subcategory: 'person-action',
    title: '调整人物视线方向',
    description: '只改变眼睛注视的目标，不转动头部或身体。',
    prompt: '只调整【人物名称】的视线，让他/她看向【画面中的具体人物 / 物体 / 方向】。\n\n只改变眼睛注视方向，保持头部朝向、面部表情、身体姿势、动作和位置完全不变。其他人物、道具、场景、光线、镜头和画幅保持原图完全不变。',
  },
  {
    id: 'action-hand-gesture',
    subcategory: 'person-action',
    title: '调整人物手部动作',
    description: '只修改指定人物一只手或双手的动作与位置。',
    prompt: '只修改【人物名称】的【左手 / 右手 / 双手】动作：让手部【具体动作，例如自然垂在身体两侧 / 轻放在桌面上】。\n\n手指数量和关节结构自然，手部与物体接触关系准确。保持人物身份、服装、表情、身体姿势和位置不变。其他人物及画面所有内容保持原图完全不变。',
  },
  {
    id: 'action-interaction',
    subcategory: 'person-action',
    title: '调整两个人物的互动',
    description: '明确两名人物的交流或递接关系，保持各自身份和位置。',
    prompt: '只调整【人物甲】与【人物乙】之间的互动：让【人物甲】向【人物乙】做出【具体互动动作，例如递出手中的杯子 / 握手 / 轻拍肩膀】，由【人物乙】以【回应动作】回应。\n\n两人的身份、服装和原有站位保持不变，动作关系自然清楚。其他人物、道具、背景、光线、镜头、构图和画幅保持原图完全不变。',
  },
];

const EDIT_GROUPS = [
  { id: 'local-character', title: '局部与人物', methodIds: ['add-remove', 'replace', 'move-subject', 'position', 'details', 'local-blur-repair', 'local-damage-repair', 'local-food-amount', 'local-scale-proportion', 'appearance-clothing', 'appearance-hairstyle', 'appearance-expression', 'appearance-accessory', 'action-sitting-standing', 'action-gaze', 'action-hand-gesture', 'action-interaction'] },
  { id: 'background', title: '背景与环境', methodIds: ['scene-layout', 'environment-condition', 'scene-state', 'background'] },
  { id: 'composition', title: '构图与镜头', methodIds: ['composition', 'camera-angle', 'subject-composition', 'focus-depth'] },
  { id: 'style', title: '风格与画面', methodIds: ['style', 'color-mood', 'lighting-exposure', 'image-quality'] },
];
const EDIT_SUBCATEGORIES = {
  'local-character': [
    { id: 'all', title: '全部', description: '围绕局部元素和人物主体进行定向修改，尽量保持其他画面内容不变。' },
    { id: 'local-content', title: '画面元素', description: '整个人或非人物体：增加、删除、替换、修复、移动' },
    { id: 'person-appearance', title: '人物外观', description: '同一个人：外貌、表情、服饰、状态' },
    { id: 'person-action', title: '人物行为', description: '同一个人：动作、姿势、朝向、视线、他人互动' },
  ],
  background: [
    { id: 'all', title: '全部', description: '围绕地点、场景布置和环境条件进行修改，保留人物和主要主体。' },
    { id: 'scene-layout', title: '场景布置', description: '墙面、门窗、桌椅、陈设、树木等与场景绑定的布局或细节。' },
    { id: 'environment-condition', title: '环境条件', description: '昼夜、季节、天气，以及雾、风等自然环境条件。' },
    { id: 'scene-state', title: '场景状态', description: '场景整体的整洁、破旧、干湿、使用痕迹或闲置状态。' },
    { id: 'scene-replacement', title: '场景替换', description: '将整个主要地点替换为新环境，同时尽量锁住人物、主体和原构图。' },
  ],
  composition: [
    { id: 'all', title: '全部', description: '只调整相机如何呈现同一画面，不改变人物、道具和场景的实际内容。' },
    { id: 'shot-format', title: '景别与画幅', description: '取景远近、画面裁切范围与横竖画幅。' },
    { id: 'camera-angle', title: '机位与视角', description: '平视、俯拍、仰拍、正侧背视角等相机观察位置。' },
    { id: 'subject-composition', title: '主体构图', description: '主体在画面内的位置、留白、均衡关系和前中后景组织。' },
    { id: 'focus-depth', title: '焦点与景深', description: '清晰主体、前后景虚化和景深层级。' },
  ],
  style: [
    { id: 'all', title: '全部', description: '不改变故事内容，只统一画面的视觉呈现与成像效果。' },
    { id: 'art-medium', title: '画风与媒介', description: '写实、电影、插画、动漫、胶片等画风与媒介。' },
    { id: 'color-mood', title: '色彩与情绪', description: '冷暖、饱和度、主色调和整体情绪基调。' },
    { id: 'lighting-exposure', title: '光影与曝光', description: '光线方向、软硬、明暗对比、阴影和曝光表现。' },
    { id: 'image-quality', title: '成像质感', description: '整体清晰度、颗粒、噪点、细腻度和画面纹理。' },
  ],
};
const PROMPT_STORAGE_KEY = 'image-generation-edit-prompts-v1';

function loadPrompts() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(PROMPT_STORAGE_KEY) || '{}');
    return Object.fromEntries(EDIT_METHODS.map((method) => {
      if (typeof saved[method.id] !== 'string') return [method.id, method.prompt];
      return [method.id, saved[method.id]];
    }));
  } catch {
    return Object.fromEntries(EDIT_METHODS.map((method) => [method.id, method.prompt]));
  }
}

export function ImageGenerationPanel() {
  const [copiedId, setCopiedId] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState('all');
  const [activeSubcategory, setActiveSubcategory] = React.useState('all');
  const [prompts, setPrompts] = React.useState(loadPrompts);
  const [editingId, setEditingId] = React.useState('');
  const [editDraft, setEditDraft] = React.useState('');

  const copyPrompt = async (method) => {
    try {
      const promptForCopy = prompts[method.id].replace(/【[^】]*】/g, '【】');
      await navigator.clipboard.writeText(promptForCopy);
      setCopiedId(method.id);
      window.setTimeout(() => setCopiedId((current) => current === method.id ? '' : current), 2200);
    } catch {
      setCopiedId('');
    }
  };

  const startEditing = (method) => {
    setEditingId(method.id);
    setEditDraft(prompts[method.id]);
  };

  const savePrompt = (methodId) => {
    const nextPrompts = { ...prompts, [methodId]: editDraft };
    setPrompts(nextPrompts);
    window.localStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(nextPrompts));
    setEditingId('');
    setEditDraft('');
  };

  const activeGroup = EDIT_GROUPS.find((group) => group.id === activeFilter);
  const activeSubcategories = activeFilter === 'all' ? [] : (EDIT_SUBCATEGORIES[activeFilter] || []);
  const activeEditSubcategory = activeSubcategories.find((subcategory) => subcategory.id === activeSubcategory);
  const visibleGroups = (activeFilter === 'all'
    ? EDIT_GROUPS
    : EDIT_GROUPS.filter((group) => group.id === activeFilter)
  ).map((group) => activeFilter === group.id && activeSubcategory !== 'all'
    ? { ...group, methodIds: group.methodIds.filter((methodId) => EDIT_METHODS.find((method) => method.id === methodId)?.subcategory === activeSubcategory) }
    : group,
  );

  return (
    <section className="image-generation-page" aria-label="图片改图模板">
      <header className="image-generation-hero">
        <div className="image-generation-hero-copy">
          <span className="image-generation-kicker"><Sparkles size={16} /> 提示词库</span>
          <h1>图片改图模板</h1>
          <p>先选一种常见改图需求，复制中文模板后补全方括号里的内容即可使用。</p>
        </div>
        <div className="image-generation-hero-icon" aria-hidden="true"><ImagePlus size={30} /></div>
      </header>

      <section className="image-generation-guide" aria-label="使用提示">
        <Layers3 size={19} aria-hidden="true" />
        <div><strong>首版只沉淀改图方式</strong><span>本地图片查看、重命名和生成进度将在后续图片资产管理模块中再接入。</span></div>
      </section>

      <nav className="image-generation-filters image-generation-primary-filters" aria-label="筛选改图方式">
        {[{ id: 'all', title: '全部' }, ...EDIT_GROUPS.map(({ id, title }) => ({ id, title }))].map((filter) => (
          <button className={activeFilter === filter.id ? 'active' : ''} type="button" aria-pressed={activeFilter === filter.id} key={filter.id} onClick={() => { setActiveFilter(filter.id); setActiveSubcategory('all'); }}>
            {filter.title}
          </button>
        ))}
      </nav>

      <div className="image-edit-groups">
        {visibleGroups.map((group) => (
          <section className="image-edit-group" key={group.id} aria-labelledby={`image-edit-group-${group.id}`}>
            {group.id !== activeFilter && (
              <h2 id={`image-edit-group-${group.id}`} className="image-edit-group-title">{group.title}</h2>
            )}
            {group.id === activeFilter && activeGroup && (
              <nav className="image-generation-filters image-generation-subfilters" aria-label={`筛选${activeGroup.title}修改方式`}>
                {activeSubcategories.map((filter) => (
                  <button className={activeSubcategory === filter.id ? 'active' : ''} type="button" aria-pressed={activeSubcategory === filter.id} key={filter.id} onClick={() => setActiveSubcategory(filter.id)}>
                    {filter.title}
                  </button>
                ))}
              </nav>
            )}
            {group.id === activeFilter && activeEditSubcategory && (
              <div className="image-edit-context">
                <h2 id={`image-edit-group-${group.id}`} className="image-edit-group-title">{activeSubcategory === 'all' ? group.title : activeEditSubcategory.title}</h2>
                <p>{activeEditSubcategory.description}</p>
              </div>
            )}
            <div className="image-edit-method-grid">
              {group.methodIds.map((methodId) => {
                const method = EDIT_METHODS.find((item) => item.id === methodId);
                const groupedMethodIndex = EDIT_GROUPS.flatMap((item) => item.methodIds).indexOf(methodId);
                const methodIndex = groupedMethodIndex >= 0 ? groupedMethodIndex : EDIT_METHODS.findIndex((item) => item.id === methodId);
                return (
                  <article className="image-edit-method-card" key={method.id}>
                    <header className="image-edit-method-heading">
                      <span className="image-method-number">{String(methodIndex + 1).padStart(2, '0')}</span>
                      <div><h3>{method.title}</h3></div>
                      {editingId === method.id ? (
                        <div className="image-edit-actions">
                          <button className="image-prompt-action image-prompt-save" type="button" onClick={() => savePrompt(method.id)}>保存</button>
                          <button className="image-prompt-action image-prompt-cancel" type="button" onClick={() => { setEditingId(''); setEditDraft(''); }}><X size={15} />取消</button>
                        </div>
                      ) : (
                        <div className="image-edit-actions">
                          <button className="image-prompt-action image-prompt-edit-icon" type="button" aria-label={`修改提示词：${method.title}`} title="修改提示词" onClick={() => startEditing(method)}><Pencil size={16} /></button>
                          <button className={copiedId === method.id ? 'image-copy-button copied' : 'image-copy-button'} type="button" aria-label={copiedId === method.id ? `已复制：${method.title}` : `复制模板：${method.title}`} title={copiedId === method.id ? '已复制' : '复制模板'} onClick={() => copyPrompt(method)}>
                        {copiedId === method.id ? <Check size={17} /> : <Copy size={17} />}
                          </button>
                        </div>
                      )}
                    </header>
                    <p className="image-method-description">{method.description}</p>
                    {editingId === method.id ? (
                      <textarea className="image-prompt-editor" aria-label={`修改提示词：${method.title}`} value={editDraft} onChange={(event) => setEditDraft(event.target.value)} />
                    ) : (
                      <div className="image-prompt-template"><p>{prompts[method.id]}</p></div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
