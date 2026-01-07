import React, { useMemo, useState } from "react";
import { View, ScrollView } from "react-native";
import dayjs from "dayjs";
import {
  Card,
  Text,
  SegmentedButtons,
  Divider,
  ActivityIndicator,
  Button,
  ProgressBar,
} from "react-native-paper";

import { useAuth } from "../providers/AuthProvider";
import { useReportSessions } from "../query/useReportSessions";
import { ReportMode, getGate, buildReportStats } from "../core/reportStats";

function calcRange(mode: ReportMode) {
  const days = mode === "7d" ? 7 : 30;
  const end = dayjs().format("YYYY-MM-DD");
  const start = dayjs().subtract(days - 1, "day").format("YYYY-MM-DD");
  return { start, end, days };
}

function deltaLabel(v: number) {
  if (v > 0.5) return "회복형";
  if (v < -0.5) return "소모형";
  if (Math.abs(v) < 0.3) return "안정형";
  return "변동형";
}

export default function ReportScreen() {
  const { user } = useAuth();
  const [mode, setMode] = useState<ReportMode>("7d");

  const { start, end, days } = useMemo(() => calcRange(mode), [mode]);

  const { data, isLoading, isError, refetch } = useReportSessions(
    user?.uid ?? null,
    start,
    end
  );

  const sessions = data ?? [];
  const gate = useMemo(() => getGate(mode, sessions), [mode, sessions]);
  const stats = useMemo(() => buildReportStats(sessions), [sessions]);

  const progress = useMemo(() => {
    // “리포트 조건을 만족하기까지” 진행률 (days 기준)
    return Math.min(1, gate.daysRecorded / gate.requiredDays);
  }, [gate.daysRecorded, gate.requiredDays]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View style={{ gap: 6 }}>
        <Text variant="headlineMedium">Report</Text>
        <Text style={{ opacity: 0.7 }}>
          {start} ~ {end} ({days}일)
        </Text>
      </View>

      <SegmentedButtons
        value={mode}
        onValueChange={(v) => setMode(v as ReportMode)}
        buttons={[
          { value: "7d", label: "최근 7일" },
          { value: "30d", label: "최근 30일" },
        ]}
      />

      {!user?.uid ? (
        <Card>
          <Card.Content style={{ gap: 8 }}>
            <Text variant="titleMedium">로그인이 필요해</Text>
            <Text style={{ opacity: 0.7 }}>
              리포트는 개인 기록을 기반으로 계산돼서 로그인 후 사용할 수 있다.
            </Text>
          </Card.Content>
        </Card>
      ) : isLoading ? (
        <Card>
          <Card.Content style={{ gap: 10 }}>
            <ActivityIndicator />
            <Text style={{ opacity: 0.7 }}>리포트 데이터를 불러오는 중...</Text>
          </Card.Content>
        </Card>
      ) : isError ? (
        <Card>
          <Card.Content style={{ gap: 10 }}>
            <Text variant="titleMedium">불러오기에 실패</Text>
            <Text style={{ opacity: 0.7 }}>
              네트워크/권한 문제일 수 있다. 다시 시도해봐.
            </Text>
            <Button mode="contained" onPress={() => refetch()}>
              다시 불러오기
            </Button>
          </Card.Content>
        </Card>
      ) : !gate.ok ? (
        // ✅ 조건 미달: “리포트 자체는 숨기고”, 조건 + 진행만 보여줌
        <Card>
          <Card.Content style={{ gap: 10 }}>
            <Text variant="titleMedium">아직 리포트를 만들기엔 데이터가 부족해</Text>

            <Text style={{ opacity: 0.75 }}>
              {mode === "7d"
                ? "최근 7일 리포트는 최소 3일 이상 기록(세션 4개 이상)이 필요하다."
                : "최근 30일 리포트는 최소 7일 이상 기록(세션 10개 이상)이 필요하다."}
            </Text>

            <Divider />

            <View style={{ gap: 6 }}>
              <Text>
                진행: {gate.daysRecorded}/{gate.requiredDays}일 · 세션{" "}
                {gate.totalSessions}/{gate.requiredSessions}
              </Text>
              <ProgressBar progress={progress} />
            </View>

            <Text style={{ opacity: 0.65 }}>
              팁: 아침/저녁 둘 다 채우는 날이 늘수록 “변화(Delta)” 분석이 정확해진다.
            </Text>
          </Card.Content>
        </Card>
      ) : (
        // ✅ 조건 충족: 이제부터 리포트 출력
        <>
          <Card>
            <Card.Content style={{ gap: 10 }}>
              <Text variant="titleMedium">요약</Text>

              <View style={{ gap: 4 }}>
                <Text>기록한 날: {stats.daysRecorded}일</Text>
                <Text>총 세션: {stats.totalSessions}</Text>
                <Text>완성된 날(아침+저녁): {stats.completeDays}일</Text>
              </View>

              <Divider />

              <View style={{ gap: 6 }}>
                <Text>
                  아침 평균 에너지:{" "}
                  {stats.morningAvgEnergy === null ? "—" : stats.morningAvgEnergy}
                </Text>
                <Text>
                  저녁 평균 에너지:{" "}
                  {stats.eveningAvgEnergy === null ? "—" : stats.eveningAvgEnergy}
                </Text>
                <Text>
                  하루 평균 변화(Delta):{" "}
                  {stats.avgDailyDelta === null ? "—" : stats.avgDailyDelta}
                  {stats.avgDailyDelta !== null ? `  (${deltaLabel(stats.avgDailyDelta)})` : ""}
                </Text>

                <Text style={{ opacity: 0.65 }}>
                  * Delta는 아침+저녁이 모두 있는 날만 계산한다.
                </Text>
              </View>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content style={{ gap: 10 }}>
              <Text variant="titleMedium">TOP 패턴</Text>

              <View style={{ gap: 6 }}>
                <Text style={{ opacity: 0.7 }}>기분 Top 3</Text>
                {stats.moodTop.length === 0 ? (
                  <Text>—</Text>
                ) : (
                  stats.moodTop.map((m) => (
                    <Text key={m.key}>
                      • {m.key} ({m.count})
                    </Text>
                  ))
                )}
              </View>

              <Divider />

              <View style={{ gap: 6 }}>
                <Text style={{ opacity: 0.7 }}>주제 Top 3</Text>
                {stats.topicTop.length === 0 ? (
                  <Text>—</Text>
                ) : (
                  stats.topicTop.map((t) => (
                    <Text key={t.key}>
                      • {t.key} ({t.count})
                    </Text>
                  ))
                )}
              </View>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content style={{ gap: 10 }}>
              <Text variant="titleMedium">코치 (v0)</Text>

              {stats.avgDailyDelta === null ? (
                <Text style={{ opacity: 0.75 }}>
                  완성된 날(아침+저녁)이 더 쌓이면 변화 기반 코치를 정확히 줄 수 있다.
                </Text>
              ) : stats.avgDailyDelta < -0.5 ? (
                <Text style={{ opacity: 0.85 }}>
                  저녁에 에너지가 떨어지는 패턴이 강하다. “저녁 루틴(수면/식사/과부하)”을
                  1개만 고정해서 실험해봐.
                </Text>
              ) : stats.avgDailyDelta > 0.5 ? (
                <Text style={{ opacity: 0.85 }}>
                  하루가 갈수록 회복되는 흐름이다. 지금의 회복 요인을 “주제/상황”과 함께
                  의식적으로 기록하면 더 빨리 패턴이 잡힌다.
                </Text>
              ) : (
                <Text style={{ opacity: 0.85 }}>
                  평균 변화는 크지 않다. 대신 “기분 Top”과 “주제 Top”에서 반복되는 상황을
                  먼저 줄이거나 강화하는 게 효율적이다.
                </Text>
              )}
            </Card.Content>
          </Card>
        </>
      )}
    </ScrollView>
  );
}
